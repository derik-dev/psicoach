export const STRIPE_PLANS = {
  starter: {
    name: 'Starter',
    amount: 9700,
    lookupKey: 'psicoach_starter_monthly_brl',
    analysesLimit: 15,
  },
  plus: {
    name: 'Plus',
    amount: 15700,
    lookupKey: 'psicoach_plus_monthly_brl',
    analysesLimit: 40,
  },
  pro: {
    name: 'Pro',
    amount: 20700,
    lookupKey: 'psicoach_pro_monthly_brl',
    analysesLimit: null,
  },
} as const;

export type PaidPlan = keyof typeof STRIPE_PLANS;

export function isPaidPlan(value: unknown): value is PaidPlan {
  return typeof value === 'string' && value in STRIPE_PLANS;
}

export function planFromLookupKey(lookupKey: string | null): PaidPlan | null {
  const match = Object.entries(STRIPE_PLANS).find(([, plan]) => plan.lookupKey === lookupKey);
  return (match?.[0] as PaidPlan | undefined) ?? null;
}

