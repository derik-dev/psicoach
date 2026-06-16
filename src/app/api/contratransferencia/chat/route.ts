import { NextRequest } from 'next/server';
import { groq, GROQ_MODEL } from '@/lib/groq';
import { getAuthenticatedUser } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (!user) return Response.json({ error: authError || 'Não autorizado.' }, { status: 401 });

  try {
    const { messages, case_summary } = await req.json() as {
      messages: { role: 'user' | 'assistant'; content: string }[];
      case_summary?: string;
    };

    if (!messages?.length) {
      return Response.json({ error: 'Mensagens ausentes.' }, { status: 400 });
    }

    const systemPrompt = [
      `Você é uma supervisora clínica especializada em contratransferência e processos do terapeuta.`,
      `Seu papel é criar um espaço seguro para o terapeuta refletir sobre suas reações emocionais durante a sessão — sem julgamento, sempre enquadrando como dado clínico valioso.`,
      ``,
      `COMO CONDUZIR A CONVERSA:`,
      `- Seja calorosa, empática e direta — como uma supervisora experiente de confiança`,
      `- Faça UMA pergunta por vez, aberta, que aprofunde a reflexão`,
      `- Prefira perguntas curtas a respostas longas`,
      `- Conecte as reações emocionais do terapeuta com o caso quando relevante`,
      `- Nunca julgue, nunca diga que o terapeuta errou`,
      `- Responda SEMPRE em português do Brasil`,
      `- Quando sentir que tem informações suficientes (sentimentos durante, momento difícil, sensação pós-sessão), sugira naturalmente gerar a análise estruturada: "Tenho o suficiente para fazer uma análise. Quer que eu gere agora?"`,
      case_summary ? `\nCONTEXTO DO CASO CLÍNICO:\n${case_summary}` : '',
    ].filter(s => s !== undefined).join('\n');

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.65,
      max_tokens: 350,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-12),
      ],
    });

    return Response.json({ reply: completion.choices[0]?.message?.content || '' });
  } catch (err) {
    console.error('CT chat error:', err);
    return Response.json({ error: 'Erro ao processar mensagem.' }, { status: 500 });
  }
}
