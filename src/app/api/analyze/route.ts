import { NextRequest } from 'next/server';
import {
  groq,
  GROQ_MODEL,
  ANALYSIS_RESPONSE_FORMAT,
  buildSystemPrompt,
  buildAnalysisUserMessage,
  parseAnalysisJson,
  JSON_SCHEMA_INSTRUCTIONS,
  TherapistProfile,
} from '@/lib/groq';
import { CaseContext } from '@/context/AppContext';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { getSubscriptionAccess } from '@/lib/subscriptions/server';

export async function POST(req: NextRequest) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (!user) {
    return Response.json({ error: authError || 'Não autorizado.' }, { status: 401 });
  }

  try {
    const access = await getSubscriptionAccess(user.id);
    if (!access.hasAccess) {
      return Response.json({ error: 'Assine um plano para gerar análises clínicas.' }, { status: 402 });
    }
    if (access.analysesLimit !== null && access.analysesUsed >= access.analysesLimit) {
      return Response.json({ error: 'Você atingiu o limite mensal do seu plano.' }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      input_text,
      approach,
      context,
      profile,
    }: {
      title?: string;
      input_text: string;
      approach: string;
      context: CaseContext;
      profile?: Omit<TherapistProfile, 'approach'>;
    } = body;

    if (!input_text || input_text.trim().length < 10) {
      return Response.json({ error: 'Relato clínico muito curto.' }, { status: 400 });
    }

    const therapistProfile: TherapistProfile = {
      approach: approach || 'não especificada',
      yearsExperience: profile?.yearsExperience,
      patientTypes: profile?.patientTypes,
      specialties: profile?.specialties,
      approachDescription: profile?.approachDescription,
      responseDetail: profile?.responseDetail,
    };

    const userMessage = buildAnalysisUserMessage(input_text, context, title);

    const systemPrompt = buildSystemPrompt(therapistProfile) + '\n\n' + JSON_SCHEMA_INSTRUCTIONS;
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.35,
      max_completion_tokens: 4096,
      reasoning_effort: 'medium',
      reasoning_format: 'hidden',
      response_format: ANALYSIS_RESPONSE_FORMAT,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? '';
    let analysis;

    try {
      analysis = parseAnalysisJson(raw);
    } catch (firstParseError) {
      console.warn('[/api/analyze] resposta inicial fora do contrato:', {
        reason: firstParseError instanceof Error ? firstParseError.message : String(firstParseError),
        finishReason: completion.choices[0]?.finish_reason,
        outputCharacters: raw.length,
      });

      const repairCompletion = await groq.chat.completions.create({
        model: GROQ_MODEL,
        temperature: 0.1,
        max_completion_tokens: 4096,
        reasoning_effort: 'low',
        reasoning_format: 'hidden',
        response_format: ANALYSIS_RESPONSE_FORMAT,
        messages: [
          {
            role: 'system',
            content: `Você corrige respostas JSON de uma API clínica. Preserve o conteúdo útil da resposta original, complete campos ausentes e corrija tipos ou valores inválidos. Não invente dados do paciente. Responda somente com o objeto JSON corrigido.\n\n${JSON_SCHEMA_INSTRUCTIONS}`,
          },
          {
            role: 'user',
            content: `A resposta abaixo não passou na validação. Motivo: ${firstParseError instanceof Error ? firstParseError.message : 'formato inválido'}.\n\nRESPOSTA ORIGINAL:\n${raw}`,
          },
        ],
      });

      const repairedRaw = repairCompletion.choices[0]?.message?.content ?? '';
      analysis = parseAnalysisJson(repairedRaw);
    }

    const analysesUsed = access.analysesUsed + 1;
    const { error: usageError } = await access.admin
      .from('subscriptions')
      .update({ analyses_used: analysesUsed })
      .eq('user_id', user.id);
    if (usageError) throw new Error(`Falha ao registrar o uso: ${usageError.message}`);

    return Response.json({ analysis, analysesUsed });
  } catch (err: unknown) {
    console.error('[/api/analyze] erro:', err);

    const msg = err instanceof Error ? err.message : String(err);
    const status = (err as { status?: number })?.status;

    if (status === 429 || msg.includes('rate_limit') || msg.includes('rate limit')) {
      return Response.json({ error: 'Serviço temporariamente sobrecarregado. Aguarde alguns segundos e tente novamente.' }, { status: 429 });
    }
    if (status === 401 || msg.includes('api_key') || msg.includes('API key')) {
      return Response.json({ error: 'Falha ao gerar análise. Verifique a chave GROQ_API_KEY.' }, { status: 500 });
    }
    if (err instanceof SyntaxError || msg.includes('Estrutura JSON inválida')) {
      return Response.json({ error: 'A IA retornou uma análise incompleta. Tente gerar novamente.' }, { status: 500 });
    }

    return Response.json({ error: 'Falha ao gerar análise. Tente novamente em instantes.' }, { status: 500 });
  }
}
