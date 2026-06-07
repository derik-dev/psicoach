import { NextRequest } from 'next/server';
import { getAuthenticatedUser, createAdminClient } from '@/lib/supabase/server';
import { getStripe, getStripePrice } from '@/lib/stripe/server';
import { isPaidPlan } from '@/lib/stripe/config';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (!user) return Response.json({ error: authError || 'Não autorizado.' }, { status: 401 });

  try {
    const { plan } = await req.json();
    if (!isPaidPlan(plan)) {
      return Response.json({ error: 'Plano inválido.' }, { status: 400 });
    }

    const stripe = getStripe();
    const admin = createAdminClient();
    const { data: currentSubscription, error: subscriptionError } = await admin
      .from('subscriptions')
      .select('stripe_customer_id, stripe_sub_id, status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (subscriptionError) throw subscriptionError;

    const activeStatuses = ['active', 'trialing', 'past_due'];
    if (
      currentSubscription?.stripe_customer_id &&
      currentSubscription.stripe_sub_id &&
      activeStatuses.includes(currentSubscription.status)
    ) {
      const portal = await stripe.billingPortal.sessions.create({
        customer: currentSubscription.stripe_customer_id,
        configuration: process.env.STRIPE_PORTAL_CONFIGURATION_ID || undefined,
        return_url: `${req.nextUrl.origin}/configuracoes`,
      });
      return Response.json({ url: portal.url });
    }

    let customerId = currentSubscription?.stripe_customer_id as string | null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: typeof user.user_metadata.full_name === 'string' ? user.user_metadata.full_name : undefined,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;

      const { error } = await admin.from('subscriptions').upsert(
        { user_id: user.id, stripe_customer_id: customerId, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
      if (error) throw error;
    }

    const price = await getStripePrice(plan);
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: price.id, quantity: 1 }],
      success_url: `${req.nextUrl.origin}/dashboard?checkout=success`,
      cancel_url: `${req.nextUrl.origin}/pricing?checkout=canceled`,
      allow_promotion_codes: true,
      metadata: { user_id: user.id, plan },
      subscription_data: { metadata: { user_id: user.id, plan } },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('[/api/stripe/checkout] erro:', error);
    const message = error instanceof Error ? error.message : 'Não foi possível iniciar o pagamento.';
    return Response.json({ error: message }, { status: 500 });
  }
}
