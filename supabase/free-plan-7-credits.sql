-- Atualiza usuários gratuitos existentes para 7 créditos/mês
update public.subscriptions
set analyses_limit = 7, updated_at = now()
where stripe_sub_id is null and analyses_limit = 0;

-- Atualiza o trigger de criação de perfil para novos cadastros.
-- Substitui a função que cria a linha inicial em subscriptions.
-- Execute no SQL Editor do Supabase após aplicar esta migração.
--
-- Exemplo de trigger (adapte ao nome existente no seu projeto):
--
-- create or replace function public.handle_new_user()
-- returns trigger language plpgsql security definer as $$
-- begin
--   insert into public.profiles (id) values (new.id);
--   insert into public.subscriptions (user_id, plan, status, analyses_limit, analyses_used)
--   values (new.id, 'free', 'inactive', 7, 0)
--   on conflict (user_id) do nothing;
--   return new;
-- end;
-- $$;
