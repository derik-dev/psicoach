alter table if exists public.sessions
  add column if not exists input_text text;

notify pgrst, 'reload schema';
