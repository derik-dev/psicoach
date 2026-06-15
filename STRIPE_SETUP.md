# Configuração do Stripe

1. Adicione em `.env.local` a chave de teste `STRIPE_SECRET_KEY` e a `SUPABASE_SERVICE_ROLE_KEY`.
2. Execute `npm run stripe:setup` para criar Starter (R$ 97), Plus (R$ 157) e Pro (R$ 207), todos mensais.
3. Copie o `STRIPE_PORTAL_CONFIGURATION_ID` exibido pelo script para `.env.local`.
4. Execute `supabase/stripe-setup.sql` no SQL Editor do Supabase.
5. No Stripe Workbench, crie um webhook para `https://SEU-DOMINIO/api/stripe/webhook` com estes eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
6. Salve o segredo do endpoint como `STRIPE_WEBHOOK_SECRET`.

Para testes locais, encaminhe eventos com o Stripe CLI para `localhost:3000/api/stripe/webhook` e use o segredo exibido pelo comando.
