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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      input_text,
      approach,
      context,
    }: {
      title?: string;
      input_text: string;
      approach: string;
      context: CaseContext;
    } = body;

    if (!input_text || input_text.trim().length < 10) {
      return Response.json({ error: 'Relato clínico muito curto.' }, { status: 400 });
    }

    const userMessage = buildAnalysisUserMessage(input_text, context, title);

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.6,
      max_tokens: 2048,
      messages: [
        {
          role: 'system',
          content: buildSystemPrompt(approach, userMessage) + '\n\n' + JSON_SCHEMA_INSTRUCTIONS,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? '';

    const analysis = parseAnalysisJson(raw);

    return Response.json({ analysis });
  } catch (err: unknown) {
    console.error('[/api/analyze] erro:', err);

    const message =
      err instanceof SyntaxError
        ? 'A IA retornou um formato inesperado. Tente novamente.'
        : 'Falha ao gerar análise. Verifique a chave GROQ_API_KEY.';

    return Response.json({ error: message }, { status: 500 });
  }
}
