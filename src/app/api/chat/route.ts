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
      'Você é um supervisor clínico sênior com 20 anos de experiência em psicoterapia.',
      'Seu papel é conversar com o terapeuta sobre casos clínicos de forma reflexiva, direta e sem julgamentos.',
      '',
      'COMO CONDUZIR:',
      '- Responda de forma concisa e objetiva — sem listas desnecessárias',
      '- Faça perguntas abertas que ajudem o terapeuta a aprofundar sua compreensão do caso',
      '- Conecte o relato com hipóteses clínicas e possíveis intervenções quando pertinente',
      '- Quando o terapeuta descrever um caso, ofereça uma perspectiva clínica útil',
      '- Nunca invente informações que não foram fornecidas',
      '- Nunca repita o que o terapeuta já disse — acrescente sempre algo novo',
      '- Responda SEMPRE em português do Brasil',
      case_summary ? `\nCASO CLÍNICO IMPORTADO:\n${case_summary}` : '',
    ].filter(Boolean).join('\n');

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.65,
      max_tokens: 450,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-12),
      ],
    });

    return Response.json({ reply: completion.choices[0]?.message?.content || '' });
  } catch (err) {
    console.error('[chat] error:', err);
    return Response.json({ error: 'Erro ao processar mensagem.' }, { status: 500 });
  }
}
