import { NextRequest } from 'next/server';
import {
  groq,
  GROQ_MODEL,
  buildSystemPrompt,
  buildAnalysisUserMessage,
  parseAnalysisJson,
  JSON_SCHEMA_INSTRUCTIONS,
} from '@/lib/groq';
import { CaseContext } from '@/context/AppContext';

interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

/* ─── detect if the user's message has enough clinical detail for a full analysis ─── */
function isAnalysisRequest(message: string): boolean {
  const minLength = 80;
  const clinicalKeywords = [
    'paciente', 'queixa', 'sessão', 'sessao', 'ansiedade', 'depressão', 'depressao',
    'sintoma', 'relato', 'caso', 'histórico', 'historico', 'terapeuta', 'sofrimento',
    'comportamento', 'diagnóstico', 'diagnostico', 'humor', 'trauma', 'fobia',
    'angústia', 'angustia', 'luto', 'família', 'familia', 'infância', 'infancia',
  ];
  const lower = message.toLowerCase();
  const hasKeyword = clinicalKeywords.some((k) => lower.includes(k));
  return message.length >= minLength && hasKeyword;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message,
      approach,
      context,
      history = [],
    }: {
      message: string;
      approach: string;
      context: CaseContext;
      history: HistoryMessage[];
    } = body;

    if (!message || message.trim().length < 3) {
      return Response.json({ error: 'Mensagem muito curta.' }, { status: 400 });
    }

    const wantsFullAnalysis = isAnalysisRequest(message);

    /* ── system prompt varies by intent ── */
    const systemContent = wantsFullAnalysis
      ? buildSystemPrompt(approach, message) +
        '\n\nO terapeuta descreveu um caso clínico. Gere a formulação completa.' +
        '\n\n' + JSON_SCHEMA_INSTRUCTIONS
      : buildSystemPrompt(approach, message) +
        '\n\nVocê está em modo conversacional. O terapeuta pode estar fazendo uma pergunta, pedindo esclarecimento ou aprofundando um ponto específico.' +
        '\nResponda de forma direta, técnica e acolhedora em texto livre (sem JSON). Máximo 3 parágrafos.';

    /* ── build messages array ── */
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemContent },
    ];

    // include prior conversation history (limit to last 10 turns to save tokens)
    const recent = history.slice(-10);
    for (const h of recent) {
      messages.push({ role: h.role, content: h.content });
    }

    // if previous messages already contain context, enrich only with current question
    if (wantsFullAnalysis && history.length === 0) {
      // first message — treat as full clinical description
      const contextual = buildAnalysisUserMessage(message, context);
      messages.push({ role: 'user', content: contextual });
    } else {
      messages.push({ role: 'user', content: message });
    }

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.65,
      max_tokens: wantsFullAnalysis ? 2048 : 512,
      messages,
    });

    const raw = completion.choices[0]?.message?.content ?? '';

    if (wantsFullAnalysis) {
      const analysis = parseAnalysisJson(raw);
      return Response.json({ analysis });
    } else {
      return Response.json({ reply: raw.trim() });
    }
  } catch (err: unknown) {
    console.error('[/api/chat] erro:', err);

    const message =
      err instanceof SyntaxError
        ? 'A IA retornou um formato inesperado. Tente novamente.'
        : 'Falha ao processar a mensagem. Verifique a chave GROQ_API_KEY.';

    return Response.json({ error: message }, { status: 500 });
  }
}
