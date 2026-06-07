import type Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/server';
import { getStripe, syncStripeSubscription } from '@/lib/stripe/server';

export const runtime = 'nodejs';

function subscriptionIdFromInvoice(invoice: Stripe.Invoice) {
  const subscription = invoice.parent?.subscription_details?.subscription;
  return typeof subscription === 'string' ? subscription : subscription?.id ?? null;
}

export async function POST(req: Request) {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return Response.json({ error: 'Webhook do Stripe não configurado.' }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(await req.text(), signature, webhookSecret);
    const admin = createAdminClient();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const subscriptionId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id;
        if (subscriptionId) {
          await syncStripeSubscription(await stripe.subscriptions.retrieve(subscriptionId), admin);
          await admin.from('subscriptions').update({ analyses_used: 0 }).eq('stripe_sub_id', subscriptionId);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await syncStripeSubscription(event.data.object, admin);
        break;
      case 'invoice.paid': {
        const invoice = event.data.object;
        const subscriptionId = subscriptionIdFromInvoice(invoice);
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await syncStripeSubscription(subscription, admin);
          if (invoice.billing_reason === 'subscription_cycle') {
            await admin.from('subscriptions').update({ analyses_used: 0 }).eq('stripe_sub_id', subscriptionId);
          }
        }
        break;
      }
      case 'invoice.payment_failed': {
        const subscriptionId = subscriptionIdFromInvoice(event.data.object);
        if (subscriptionId) {
          await admin.from('subscriptions').update({ status: 'past_due' }).eq('stripe_sub_id', subscriptionId);
        }
        break;
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('[/api/stripe/webhook] erro:', error);
    const message = error instanceof Error ? error.message : 'Webhook inválido.';
    return Response.json({ error: message }, { status: 400 });
  }
}
