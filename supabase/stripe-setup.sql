-- Execute no SQL Editor do Supabase antes de ativar o Stripe em produção.
alter table public.subscriptions
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_sub_id text,
  add column if not exists current_period_start timestamptz,
  add column if not exists current_period_end timestamptz,
  add column if not exists updated_at timestamptz default now();

create unique index if not exists subscriptions_user_id_key
  on public.subscriptions (user_id);

create unique index if not exists subscriptions_stripe_customer_id_key
  on public.subscriptions (stripe_customer_id)
  where stripe_customer_id is not null;

create unique index if not exists subscriptions_stripe_sub_id_key
  on public.subscriptions (stripe_sub_id)
  where stripe_sub_id is not null;

-- O projeto ainda não cobrava de verdade. Contas sem assinatura Stripe voltam ao estado gratuito.
update public.subscriptions
set plan = 'free', status = 'inactive', analyses_limit = 7, updated_at = now()
where stripe_sub_id is null;

-- Somente o backend com service role altera cobrança e consumo.
revoke insert, update, delete on public.subscriptions from anon, authenticated;
grant select on public.subscriptions to authenticated;
