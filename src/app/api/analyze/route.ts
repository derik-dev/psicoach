import { NextRequest } from 'next/server';
import {
  groq,
  GROQ_MODEL,
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
    };

    const userMessage = buildAnalysisUserMessage(input_text, context, title);

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.6,
      max_tokens: 2048,
      messages: [
        {
          role: 'system',
          content: buildSystemPrompt(therapistProfile, userMessage) + '\n\n' + JSON_SCHEMA_INSTRUCTIONS,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? '';
    const analysis = parseAnalysisJson(raw);

    const analysesUsed = access.analysesUsed + 1;
    const { error: usageError } = await access.admin
      .from('subscriptions')
      .update({ analyses_used: analysesUsed })
      .eq('user_id', user.id);
    if (usageError) throw new Error(`Falha ao registrar o uso: ${usageError.message}`);

    return Response.json({ analysis, analysesUsed });
  } catch (err: unknown) {
    console.error('[/api/analyze] erro:', err);

    const message =
      err instanceof SyntaxError
        ? 'A IA retornou um formato inesperado. Tente novamente.'
        : 'Falha ao gerar análise. Verifique a chave GROQ_API_KEY.';

    return Response.json({ error: message }, { status: 500 });
  }
}
