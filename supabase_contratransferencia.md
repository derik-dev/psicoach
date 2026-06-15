CREATE TABLE contratransference_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES cases(id),
  user_id uuid REFERENCES auth.users(id),
  sentimento_durante text NOT NULL,
  momento_dificil text NOT NULL,
  sentimento_apos text NOT NULL,
  tema_evitado text,
  percepcao_paciente text,
  resultado jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contratransference_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own analyses"
  ON contratransference_analyses
  FOR ALL
  USING (auth.uid() = user_id);
