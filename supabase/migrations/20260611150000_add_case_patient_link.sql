-- Persiste o vínculo criado pela progressão clínica entre casos e pacientes.
alter table if exists public.cases
  add column if not exists patient_id uuid,
  add column if not exists session_number integer;

do $$
begin
  if to_regclass('public.patients') is not null
     and not exists (
       select 1
       from pg_constraint
       where conrelid = 'public.cases'::regclass
         and conname = 'cases_patient_id_fkey'
     ) then
    alter table public.cases
      add constraint cases_patient_id_fkey
      foreign key (patient_id)
      references public.patients(id)
      on delete set null;
  end if;
end
$$;

create index if not exists cases_patient_id_created_at_idx
  on public.cases (patient_id, created_at desc)
  where patient_id is not null;

notify pgrst, 'reload schema';
