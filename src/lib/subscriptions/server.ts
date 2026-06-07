import { createAdminClient } from '@/lib/supabase/server';

export async function getSubscriptionAccess(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('subscriptions')
    .select('status, stripe_sub_id, analyses_used, analyses_limit')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(`Falha ao consultar assinatura: ${error.message}`);

  const hasAccess = Boolean(
    data?.stripe_sub_id && ['active', 'trialing'].includes(data.status)
  );

  return {
    admin,
    hasAccess,
    analysesUsed: data?.analyses_used ?? 0,
    analysesLimit: data ? data.analyses_limit : 0,
  };
}
