# Alterações da integração com Stripe

## Arquivos criados

- `.env.example`
- `STRIPE_SETUP.md`
- `scripts/setup-stripe.mjs`
- `supabase/stripe-setup.sql`
- `src/lib/stripe/config.ts`
- `src/lib/stripe/server.ts`
- `src/lib/stripe/client.ts`
- `src/lib/subscriptions/server.ts`
- `src/app/api/stripe/checkout/route.ts`
- `src/app/api/stripe/portal/route.ts`
- `src/app/api/stripe/webhook/route.ts`

## Arquivos alterados

- `package.json`
- `package-lock.json`
- `src/lib/supabase/server.ts`
- `src/context/AppContext.tsx`
- `src/app/pricing/page.tsx`
- `src/app/(app)/configuracoes/page.tsx`
- `src/app/(app)/nova-analise/page.tsx`
- `src/app/api/analyze/route.ts`
- `src/app/api/chat/route.ts`
- `src/app/api/transcribe/route.ts`

## Dependência instalada

- `stripe@^22.2.0`

## Funcionalidades implementadas

- Planos mensais Starter por R$ 97, Plus por R$ 157 e Pro por R$ 207.
- Stripe Checkout para iniciar assinaturas.
- Portal do Cliente para trocar plano, cancelar assinatura e atualizar pagamento.
- Webhooks para sincronizar pagamentos, renovações, atrasos e cancelamentos.
- Controle de acesso às APIs conforme a assinatura.
- Controle dos limites mensais de análises no backend.
- Script `npm run stripe:setup` para criar os produtos e preços no Stripe.

## Validações executadas

- `npm run lint`: concluído com sucesso.
- `npm run build`: concluído com sucesso.

## Ativação

As chaves do Stripe ainda precisam ser adicionadas ao `.env.local`. As instruções completas estão em `STRIPE_SETUP.md`.
