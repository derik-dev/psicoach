import { supabase } from '@/lib/supabase/client';
import type { PaidPlan } from './config';

async function redirectFromStripeEndpoint(path: string, body?: object) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Faça login para continuar.');

  const response = await fetch(path, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok || !data.url) throw new Error(data.error || 'Não foi possível abrir o Stripe.');

  window.location.assign(data.url);
}

export function startCheckout(plan: PaidPlan) {
  return redirectFromStripeEndpoint('/api/stripe/checkout', { plan });
}

export function openCustomerPortal() {
  return redirectFromStripeEndpoint('/api/stripe/portal');
}
