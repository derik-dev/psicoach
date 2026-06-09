import { createAdminClient } from '@/lib/supabase/server';

export async function getSubscriptionAccess(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('subscriptions')
    .select('status, stripe_sub_id, analyses_used, analyses_limit')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(`Falha ao consultar assinatura: ${error.message}`);

  const hasPaidSub = Boolean(
    data?.stripe_sub_id && ['active', 'trialing'].includes(data.status)
  );
  const analysesLimit = data?.analyses_limit ?? 7;
  const analysesUsed = data?.analyses_used ?? 0;
  // Free users get 7 credits/month; paid users use Stripe subscription
  const hasAccess = hasPaidSub || analysesLimit > 0;

  return {
    admin,
    hasAccess,
    analysesUsed,
    analysesLimit,
  };
}
