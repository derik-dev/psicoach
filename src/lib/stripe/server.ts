import Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/server';
import { isPaidPlan, planFromLookupKey, STRIPE_PLANS, type PaidPlan } from './config';

let stripeClient: Stripe | null = null;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY não configurada.');

  stripeClient ??= new Stripe(secretKey);
  return stripeClient;
}

export async function getStripePrice(plan: PaidPlan) {
  const stripe = getStripe();
  const prices = await stripe.prices.list({
    active: true,
    lookup_keys: [STRIPE_PLANS[plan].lookupKey],
    limit: 1,
  });

  const price = prices.data[0];
  if (!price) {
    throw new Error(`Preço do plano ${STRIPE_PLANS[plan].name} não encontrado no Stripe.`);
  }

  return price;
}

function stripeId(value: string | { id: string } | null) {
  return typeof value === 'string' ? value : value?.id ?? null;
}

export async function syncStripeSubscription(
  subscription: Stripe.Subscription,
  admin: SupabaseClient = createAdminClient()
) {
  const customerId = stripeId(subscription.customer);
  const item = subscription.items.data[0];
  const metadataPlan = subscription.metadata.plan;
  const pricePlan = planFromLookupKey(item?.price.lookup_key ?? null);
  const plan = pricePlan ?? (isPaidPlan(metadataPlan) ? metadataPlan : null);

  let userId = subscription.metadata.user_id || null;
  if (!userId && customerId) {
    const { data } = await admin
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle();
    userId = data?.user_id ?? null;
  }

  if (!userId) throw new Error(`Assinatura ${subscription.id} sem usuário associado.`);
  if (!plan) throw new Error(`Assinatura ${subscription.id} sem plano PsiCoach reconhecido.`);

  const isDeleted = subscription.status === 'canceled' || subscription.status === 'incomplete_expired';
  const savedPlan = isDeleted ? 'free' : plan;
  const analysesLimit = savedPlan === 'free' ? 0 : STRIPE_PLANS[savedPlan].analysesLimit;

  const { error } = await admin.from('subscriptions').upsert(
    {
      user_id: userId,
      plan: savedPlan,
      status: subscription.status,
      stripe_customer_id: customerId,
      stripe_sub_id: subscription.id,
      analyses_limit: analysesLimit,
      current_period_start: item ? new Date(item.current_period_start * 1000).toISOString() : null,
      current_period_end: item ? new Date(item.current_period_end * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) throw new Error(`Falha ao sincronizar assinatura: ${error.message}`);
}
