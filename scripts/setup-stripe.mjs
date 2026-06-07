import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  throw new Error('Adicione STRIPE_SECRET_KEY ao arquivo .env.local antes de executar este script.');
}

const stripe = new Stripe(secretKey);
const plans = [
  {
    id: 'starter',
    name: 'PsiCoach Starter',
    description: 'Até 15 análises clínicas por mês.',
    amount: 9700,
    lookupKey: 'psicoach_starter_monthly_brl',
  },
  {
    id: 'plus',
    name: 'PsiCoach Plus',
    description: 'Até 40 análises clínicas por mês e recursos avançados.',
    amount: 15700,
    lookupKey: 'psicoach_plus_monthly_brl',
  },
  {
    id: 'pro',
    name: 'PsiCoach Pro',
    description: 'Análises ilimitadas para clínicas e equipes.',
    amount: 20700,
    lookupKey: 'psicoach_pro_monthly_brl',
  },
];

async function ensurePrice(plan) {
  const existingPrices = await stripe.prices.list({
    active: true,
    lookup_keys: [plan.lookupKey],
    expand: ['data.product'],
    limit: 1,
  });
  const existing = existingPrices.data[0];

  if (existing) {
    if (
      existing.unit_amount !== plan.amount ||
      existing.currency !== 'brl' ||
      existing.recurring?.interval !== 'month'
    ) {
      throw new Error(`O preço ${plan.lookupKey} já existe com valor ou periodicidade diferente.`);
    }
    return existing;
  }

  const product = await stripe.products.create({
    name: plan.name,
    description: plan.description,
    metadata: { psicoach_plan: plan.id },
  });

  return stripe.prices.create({
    product: product.id,
    currency: 'brl',
    unit_amount: plan.amount,
    recurring: { interval: 'month' },
    lookup_key: plan.lookupKey,
    metadata: { psicoach_plan: plan.id },
  });
}

const prices = [];
for (const plan of plans) {
  const price = await ensurePrice(plan);
  prices.push(price);
  console.log(`${plan.name}: ${price.id} (${plan.lookupKey})`);
}

const portalSettings = {
  business_profile: { headline: 'Gerencie sua assinatura PsiCoach AI' },
  features: {
    customer_update: { enabled: true, allowed_updates: ['email', 'address'] },
    invoice_history: { enabled: true },
    payment_method_update: { enabled: true },
    subscription_cancel: { enabled: true, mode: 'at_period_end' },
    subscription_update: {
      enabled: true,
      default_allowed_updates: ['price'],
      proration_behavior: 'create_prorations',
      products: prices.map((price) => ({
        product: typeof price.product === 'string' ? price.product : price.product.id,
        prices: [price.id],
      })),
    },
  },
};

const portalConfiguration = process.env.STRIPE_PORTAL_CONFIGURATION_ID
  ? await stripe.billingPortal.configurations.update(
      process.env.STRIPE_PORTAL_CONFIGURATION_ID,
      portalSettings
    )
  : await stripe.billingPortal.configurations.create(portalSettings);

console.log('\nAdicione ao .env.local:');
console.log(`STRIPE_PORTAL_CONFIGURATION_ID=${portalConfiguration.id}`);
