import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { groq } from '@/lib/groq';
import { getSubscriptionAccess } from '@/lib/subscriptions/server';

export async function POST(req: NextRequest) {
  const { user, error } = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error }, { status: 401 });

  try {
    const access = await getSubscriptionAccess(user.id);
    if (!access.hasAccess) {
      return NextResponse.json({ error: 'Assine um plano para transcrever áudios.' }, { status: 402 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Falha ao consultar assinatura.';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 });
  }

  const file = formData.get('audio') as File | null;
  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'Nenhum arquivo de áudio enviado.' }, { status: 400 });
  }

  try {
    const transcription = await groq.audio.transcriptions.create({
      file,
      model: 'whisper-large-v3',
      language: 'pt',
    });
    return NextResponse.json({ text: transcription.text });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao transcrever áudio.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
