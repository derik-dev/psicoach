import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { groq } from '@/lib/groq';

export async function POST(req: NextRequest) {
  const { error } = await getAuthenticatedUser(req);
  if (error) return NextResponse.json({ error }, { status: 401 });

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
