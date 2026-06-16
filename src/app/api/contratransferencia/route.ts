import { NextRequest } from 'next/server';
import { groq, GROQ_MODEL } from '@/lib/groq';
import { getAuthenticatedUser, createAdminClient } from '@/lib/supabase/server';

const SYSTEM_PROMPT = `Você é um supervisor clínico especializado em processos do terapeuta e contratransferência.

Sua função é ajudar o terapeuta a identificar como suas reações emocionais podem estar influenciando a condução do caso — sem julgamento moral, sempre enquadrando como dado clínico valioso.

REGRAS ABSOLUTAS:
- Responda SEMPRE em português do Brasil, independentemente do idioma do relato
- Nunca diga que o terapeuta errou ou agiu de forma errada
- Sempre enquadre como dado clínico, nunca como falha pessoal
- Baseie TODA análise em elementos concretos do relato
- Nunca invente padrões que não estejam nos dados
- Cite apenas referências bibliográficas reais

Responda APENAS em JSON válido, sem texto antes ou depois, sem blocos de código:
{
  "padrao_identificado": "O que os sentimentos revelam clinicamente. Conecta com o caso específico.",
  "impacto_no_caso": "Como isso pode estar afetando a condução especificamente.",
  "o_que_observar": ["Sinal concreto 1", "Sinal concreto 2", "Sinal concreto 3"],
  "pergunta_reflexiva": "Uma pergunta que convida aprofundamento do autoconhecimento.",
  "nivel_processo": "leve | atencao | significativo",
  "referencia": "Autor real (Ano). Título real. Por que é relevante aqui."
}`;

export async function POST(req: NextRequest) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (!user) {
    return Response.json({ error: authError || 'Não autorizado.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      case_id,
      case_summary,
      sentimento_durante,
      momento_dificil,
      sentimento_apos,
      tema_evitado,
      percepcao_paciente,
      observacoes_livres,
    }: {
      case_id: string;
      case_summary: string;
      sentimento_durante: string;
      momento_dificil: string;
      sentimento_apos: string;
      tema_evitado?: string;
      percepcao_paciente?: string;
      observacoes_livres?: string;
    } = body;

    if (!case_id || !sentimento_durante?.trim() || !momento_dificil?.trim() || !sentimento_apos?.trim()) {
      return Response.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }

    const userMessage = [
      `CASO CLÍNICO:\n${case_summary}`,
      `\nRELATO DO TERAPEUTA:`,
      `Como se sentiu durante: ${sentimento_durante}`,
      `O que travou ou incomodou: ${momento_dificil}`,
      `Como saiu da sessão: ${sentimento_apos}`,
      tema_evitado?.trim() ? `Tema evitado: ${tema_evitado}` : null,
      percepcao_paciente?.trim() ? `Percepção do paciente sobre ela: ${percepcao_paciente}` : null,
      observacoes_livres?.trim() ? `Observações adicionais: ${observacoes_livres}` : null,
    ].filter(Boolean).join('\n');

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.35,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
    });

    const raw = completion.choices[0]?.message?.content || '';
    const clean = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
    const resultado = JSON.parse(clean);

    const admin = createAdminClient();
    const { data, error: dbError } = await admin
      .from('contratransference_analyses')
      .insert({
        case_id,
        user_id: user.id,
        sentimento_durante,
        momento_dificil,
        sentimento_apos,
        tema_evitado: tema_evitado || null,
        percepcao_paciente: percepcao_paciente || null,
        observacoes_livres: observacoes_livres || null,
        resultado,
      })
      .select('id, created_at')
      .single();

    if (dbError) {
      console.error('CT save error:', dbError);
      return Response.json({ resultado, saved: false });
    }

    return Response.json({ resultado, id: data.id, created_at: data.created_at, saved: true });
  } catch (err) {
    console.error('Contratransferência error:', err);
    return Response.json({ error: 'Erro ao processar análise.' }, { status: 500 });
  }
}
