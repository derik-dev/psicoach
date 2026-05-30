import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function getAuthenticatedUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return { user: null, error: 'Token ausente.' };

  const supabase = createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return { user: null, error: 'Sessão inválida ou expirada.' };

  return { user, error: null };
}
