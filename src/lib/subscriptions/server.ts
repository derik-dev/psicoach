import { createAdminClient } from '@/lib/supabase/server';

export async function getSubscriptionAccess(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('subscriptions')
    .select('status, stripe_sub_id, analyses_used, analyses_limit')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(`Falha ao consultar assinatura: ${error.message}`);

  const analysesUsed = data?.analyses_used ?? 0;

  return {
    admin,
    hasAccess: true,
    analysesUsed,
    analysesLimit: null, // null = ilimitado (modo teste)
  };
}
