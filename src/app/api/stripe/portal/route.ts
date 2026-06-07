import { NextRequest } from 'next/server';
import { createAdminClient, getAuthenticatedUser } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (!user) return Response.json({ error: authError || 'Não autorizado.' }, { status: 401 });

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    if (!data?.stripe_customer_id) {
      return Response.json({ error: 'Nenhuma assinatura encontrada.' }, { status: 404 });
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: data.stripe_customer_id,
      configuration: process.env.STRIPE_PORTAL_CONFIGURATION_ID || undefined,
      return_url: `${req.nextUrl.origin}/configuracoes`,
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('[/api/stripe/portal] erro:', error);
    const message = error instanceof Error ? error.message : 'Não foi possível abrir a assinatura.';
    return Response.json({ error: message }, { status: 500 });
  }
}
