<<<<<<< HEAD
Agora o backend

16:15
Arquitetura Completa de Backend — PsiCoach AI ⚙️
Visão Geral da Stack
Antes de entrar nas rotas, deixa eu justificar cada escolha tecnológica pra você entender o porquê, não só o o quê:

Frontend (você já sabe)
        ↓
Supabase — banco + auth + storage
        ↓
Edge Functions — lógica de negócio
        ↓
Anthropic API — o cérebro do produto
        ↓
Stripe — pagamentos
        ↓
Resend — emails
Por que Supabase e não Node.js do zero? Porque você é junior e precisa de velocidade. Supabase te dá banco PostgreSQL, autenticação, storage de arquivos e API automática sem você precisar codar servidor. Você foca no produto, não em infraestrutura.

Banco de Dados — Tabelas
Tabela: users
Gerenciada pelo Supabase Auth, mas extendida por você

sql
id              uuid PRIMARY KEY
email           text UNIQUE NOT NULL
full_name       text
crp             text
avatar_url      text
created_at      timestamp
last_login      timestamp
Tabela: profiles
Perfil clínico da psicóloga — coração da personalização da IA

sql
id                    uuid PRIMARY KEY
user_id               uuid REFERENCES users
years_experience      text        -- "1-2", "3-5", "5-10", "+10"
patient_types         text[]      -- ["adultos", "adolescentes"]
specialties           text[]      -- ["ansiedade", "trauma"]
main_approach         text        -- "TCC", "Psicanálise", etc
approach_description  text        -- descrição livre dela
response_detail       text        -- "conciso" ou "detalhado"
onboarding_completed  boolean     DEFAULT false
updated_at            timestamp
Tabela: subscriptions
Controle de plano e limites de uso

sql
id                  uuid PRIMARY KEY
user_id             uuid REFERENCES users
plan                text        -- "starter", "pro", "clinica"
status              text        -- "active", "canceled", "past_due"
stripe_customer_id  text
stripe_sub_id       text
analyses_used       integer     DEFAULT 0
analyses_limit      integer     -- 10 pra starter, null pra pro
current_period_start timestamp
current_period_end   timestamp
created_at          timestamp
Tabela: cases
Casos clínicos salvos pela psicóloga

sql
id              uuid PRIMARY KEY
user_id         uuid REFERENCES users
title           text
input_text      text NOT NULL   -- o que ela digitou
approach_used   text            -- abordagem usada nessa análise
context         jsonb           -- contexto adicional (sessões, diagnóstico, etc)
analysis        jsonb           -- resposta estruturada da IA
notes           text            -- anotações pessoais dela
tags            text[]
is_archived     boolean DEFAULT false
created_at      timestamp
updated_at      timestamp
Tabela: messages
Chat livre após análise — histórico de conversa por caso

sql
id          uuid PRIMARY KEY
case_id     uuid REFERENCES cases
user_id     uuid REFERENCES users
role        text    -- "user" ou "assistant"
content     text
created_at  timestamp
Tabela: library_articles
Conteúdo da Biblioteca Clínica

sql
id          uuid PRIMARY KEY
title       text
content     text
approach    text[]      -- abordagens relacionadas
themes      text[]      -- ["ansiedade", "técnicas", "ética"]
created_at  timestamp
updated_at  timestamp
Tabela: audit_logs
Registro de ações importantes — necessário por questão de segurança e LGPD

sql
id          uuid PRIMARY KEY
user_id     uuid REFERENCES users
action      text    -- "analysis_created", "case_deleted", etc
metadata    jsonb
ip_address  text
created_at  timestamp
Edge Functions — Lógica de Negócio
Edge Functions são funções serverless do Supabase. Você escreve em TypeScript/JavaScript e elas rodam na nuvem sem você precisar de servidor.

1. POST /analyze-case
A função mais importante do produto

O que faz: Recebe o caso descrito pela psicóloga, monta o prompt personalizado com o perfil dela e manda pra API do Claude. Retorna análise estruturada.

Fluxo interno:

javascript
1. Verifica autenticação
2. Verifica se tem análises disponíveis no plano
3. Busca perfil da psicóloga (abordagem, especialidade, experiência)
4. Monta o system prompt personalizado
5. Chama API do Claude
6. Parseia resposta em JSON estruturado
7. Salva o caso no banco
8. Incrementa analyses_used
9. Retorna análise pro frontend
Body recebido:

json
{
  "title": "Caso resistência",
  "input_text": "Paciente 34 anos...",
  "approach_override": null,
  "context": {
    "sessions_count": "10-20",
    "current_diagnosis": "F41.1",
    "already_tried": "Técnicas de exposição",
    "specific_question": "Como lidar com a resistência?"
  }
}
Resposta retornada:

json
{
  "case_id": "uuid",
  "analysis": {
    "hypothesis": "texto...",
    "approaches": ["abordagem 1", "abordagem 2"],
    "questions": ["pergunta 1", "pergunta 2"],
    "references": ["referência 1"],
    "blind_spot": "texto...",
    "alerts": []
  }
}
2. POST /chat-message
Chat livre após análise

O que faz: Recebe mensagem da psicóloga dentro de um caso já analisado. Envia histórico completo da conversa + análise original pra IA ter contexto. Retorna resposta e salva no banco.

Body recebido:

json
{
  "case_id": "uuid",
  "message": "Pode aprofundar o ponto sobre transferência?"
}
3. POST /onboarding/complete
Finaliza onboarding

O que faz: Salva perfil clínico da psicóloga e marca onboarding como completo.

Body recebido:

json
{
  "years_experience": "3-5",
  "patient_types": ["adultos", "casais"],
  "specialties": ["ansiedade", "depressão"],
  "main_approach": "TCC",
  "approach_description": "Trabalho com protocolo..."
}
4. GET /cases
Lista histórico de casos

Parâmetros:

?search=resistência
&approach=TCC
&tag=urgente
&page=1
&limit=10
Retorna:

json
{
  "cases": [...],
  "total": 47,
  "page": 1
}
5. GET /cases/:id
Busca caso individual com histórico de chat

Retorna:

json
{
  "case": { ...dados do caso... },
  "messages": [ ...histórico do chat... ]
}
6. PATCH /cases/:id
Atualiza notas ou tags de um caso

Body:

json
{
  "notes": "Na sessão seguinte ela abriu sobre o pai...",
  "tags": ["urgente", "encaminhamento"]
}
7. DELETE /cases/:id
Deleta caso — com soft delete

Não deleta de verdade do banco. Marca is_archived = true. Necessário pra LGPD — você precisa conseguir restaurar se ela pedir.

8. POST /stripe/create-checkout
Cria sessão de pagamento

O que faz: Recebe o plano escolhido, cria sessão no Stripe e retorna URL de checkout. Usuária é redirecionada pro Stripe pagar.

Body:

json
{
  "plan": "pro",
  "billing": "monthly"
}
Retorna:

json
{
  "checkout_url": "https://checkout.stripe.com/..."
}
9. POST /stripe/webhook
Recebe eventos do Stripe

O mais importante do sistema de pagamento. O Stripe manda eventos pra cá automaticamente quando algo acontece. Você escuta e age.

Eventos que precisa tratar:

Evento Stripe	O que fazer
checkout.session.completed	Ativar assinatura no banco
invoice.payment_succeeded	Renovar período, zerar analyses_used
invoice.payment_failed	Mudar status pra past_due, mandar email
customer.subscription.deleted	Cancelar assinatura, mudar plano pra free
10. POST /stripe/cancel-subscription
Cancela assinatura

Fluxo interno:

1. Recebe motivo do cancelamento
2. Cancela no Stripe (no fim do período atual)
3. Atualiza status no banco
4. Dispara email de confirmação
5. Opcional: oferece desconto antes de cancelar
11. GET /subscription/status
Retorna status atual da assinatura

Usado pelo frontend pra saber quantas análises restam, qual plano, quando renova.

Retorna:

json
{
  "plan": "pro",
  "status": "active",
  "analyses_used": 7,
  "analyses_limit": null,
  "renewal_date": "2024-02-15"
}
12. GET /library
Lista artigos da biblioteca

Parâmetros:

?search=transferência
&approach=Psicanálise
&theme=técnicas
13. POST /auth/delete-account
Deleta conta — fluxo LGPD

Fluxo:

1. Confirma senha
2. Cancela assinatura se ativa
3. Anonimiza dados pessoais (não deleta análises, anonimiza)
4. Deleta auth do Supabase
5. Envia email de confirmação
14. GET /admin/metrics (só você acessa)
Métricas do negócio

Retorna:

json
{
  "mrr": 19700,
  "active_users": 100,
  "churn_this_month": 3,
  "new_signups_this_month": 15,
  "total_analyses": 4820,
  "avg_analyses_per_user": 48.2
}
Sistema de Emails — Resend
Todos os emails disparados automaticamente:

Trigger	Email enviado
Cadastro	Boas-vindas + link pra completar onboarding
Primeiro pagamento	Confirmação + recibo
80% do limite usado	"Você usou 8 das 10 análises"
Pagamento falhou	Aviso com link pra atualizar cartão
Cancelamento	Confirmação + pesquisa de motivo
7 dias sem logar	"Tem um caso esperando por você"
Renovação 3 dias antes	Aviso de cobrança
Segurança — O Que Não Pode Esquecer
Row Level Security (RLS) no Supabase Cada psicóloga só acessa os próprios dados. Uma linha de configuração no Supabase garante isso. Não pode esquecer — é crítico.

sql
-- Exemplo na tabela cases
CREATE POLICY "Users can only see own cases"
ON cases FOR ALL
USING (auth.uid() = user_id);
Variáveis de ambiente — nunca no código

ANTHROPIC_API_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
SUPABASE_SERVICE_KEY
Rate limiting Limitar chamadas à /analyze-case pra evitar abuso. Supabase tem isso nativo.

Resumo de Todas as Rotas
Método	Rota	Função
POST	/analyze-case	Analisar caso com IA
POST	/chat-message	Chat sobre caso
POST	/onboarding/complete	Salvar perfil
GET	/cases	Listar casos
GET	/cases/:id	Buscar caso
PATCH	/cases/:id	Atualizar caso
DELETE	/cases/:id	Arquivar caso
POST	/stripe/create-checkout	Iniciar pagamento
POST	/stripe/webhook	Eventos Stripe
POST	/stripe/cancel-subscription	Cancelar plano
GET	/subscription/status	Status assinatura
GET	/library	Biblioteca clínica
POST	/auth/delete-account	Deletar conta
GET	/admin/metrics	Métricas admin

=======
Agora o backend

16:15
Arquitetura Completa de Backend — PsiCoach AI ⚙️
Visão Geral da Stack
Antes de entrar nas rotas, deixa eu justificar cada escolha tecnológica pra você entender o porquê, não só o o quê:

Frontend (você já sabe)
        ↓
Supabase — banco + auth + storage
        ↓
Edge Functions — lógica de negócio
        ↓
Anthropic API — o cérebro do produto
        ↓
Stripe — pagamentos
        ↓
Resend — emails
Por que Supabase e não Node.js do zero? Porque você é junior e precisa de velocidade. Supabase te dá banco PostgreSQL, autenticação, storage de arquivos e API automática sem você precisar codar servidor. Você foca no produto, não em infraestrutura.

Banco de Dados — Tabelas
Tabela: users
Gerenciada pelo Supabase Auth, mas extendida por você

sql
id              uuid PRIMARY KEY
email           text UNIQUE NOT NULL
full_name       text
crp             text
avatar_url      text
created_at      timestamp
last_login      timestamp
Tabela: profiles
Perfil clínico da psicóloga — coração da personalização da IA

sql
id                    uuid PRIMARY KEY
user_id               uuid REFERENCES users
years_experience      text        -- "1-2", "3-5", "5-10", "+10"
patient_types         text[]      -- ["adultos", "adolescentes"]
specialties           text[]      -- ["ansiedade", "trauma"]
main_approach         text        -- "TCC", "Psicanálise", etc
approach_description  text        -- descrição livre dela
response_detail       text        -- "conciso" ou "detalhado"
onboarding_completed  boolean     DEFAULT false
updated_at            timestamp
Tabela: subscriptions
Controle de plano e limites de uso

sql
id                  uuid PRIMARY KEY
user_id             uuid REFERENCES users
plan                text        -- "starter", "pro", "clinica"
status              text        -- "active", "canceled", "past_due"
stripe_customer_id  text
stripe_sub_id       text
analyses_used       integer     DEFAULT 0
analyses_limit      integer     -- 10 pra starter, null pra pro
current_period_start timestamp
current_period_end   timestamp
created_at          timestamp
Tabela: cases
Casos clínicos salvos pela psicóloga

sql
id              uuid PRIMARY KEY
user_id         uuid REFERENCES users
title           text
input_text      text NOT NULL   -- o que ela digitou
approach_used   text            -- abordagem usada nessa análise
context         jsonb           -- contexto adicional (sessões, diagnóstico, etc)
analysis        jsonb           -- resposta estruturada da IA
notes           text            -- anotações pessoais dela
tags            text[]
is_archived     boolean DEFAULT false
created_at      timestamp
updated_at      timestamp
Tabela: messages
Chat livre após análise — histórico de conversa por caso

sql
id          uuid PRIMARY KEY
case_id     uuid REFERENCES cases
user_id     uuid REFERENCES users
role        text    -- "user" ou "assistant"
content     text
created_at  timestamp
Tabela: library_articles
Conteúdo da Biblioteca Clínica

sql
id          uuid PRIMARY KEY
title       text
content     text
approach    text[]      -- abordagens relacionadas
themes      text[]      -- ["ansiedade", "técnicas", "ética"]
created_at  timestamp
updated_at  timestamp
Tabela: audit_logs
Registro de ações importantes — necessário por questão de segurança e LGPD

sql
id          uuid PRIMARY KEY
user_id     uuid REFERENCES users
action      text    -- "analysis_created", "case_deleted", etc
metadata    jsonb
ip_address  text
created_at  timestamp
Edge Functions — Lógica de Negócio
Edge Functions são funções serverless do Supabase. Você escreve em TypeScript/JavaScript e elas rodam na nuvem sem você precisar de servidor.

1. POST /analyze-case
A função mais importante do produto

O que faz: Recebe o caso descrito pela psicóloga, monta o prompt personalizado com o perfil dela e manda pra API do Claude. Retorna análise estruturada.

Fluxo interno:

javascript
1. Verifica autenticação
2. Verifica se tem análises disponíveis no plano
3. Busca perfil da psicóloga (abordagem, especialidade, experiência)
4. Monta o system prompt personalizado
5. Chama API do Claude
6. Parseia resposta em JSON estruturado
7. Salva o caso no banco
8. Incrementa analyses_used
9. Retorna análise pro frontend
Body recebido:

json
{
  "title": "Caso resistência",
  "input_text": "Paciente 34 anos...",
  "approach_override": null,
  "context": {
    "sessions_count": "10-20",
    "current_diagnosis": "F41.1",
    "already_tried": "Técnicas de exposição",
    "specific_question": "Como lidar com a resistência?"
  }
}
Resposta retornada:

json
{
  "case_id": "uuid",
  "analysis": {
    "hypothesis": "texto...",
    "approaches": ["abordagem 1", "abordagem 2"],
    "questions": ["pergunta 1", "pergunta 2"],
    "references": ["referência 1"],
    "blind_spot": "texto...",
    "alerts": []
  }
}
2. POST /chat-message
Chat livre após análise

O que faz: Recebe mensagem da psicóloga dentro de um caso já analisado. Envia histórico completo da conversa + análise original pra IA ter contexto. Retorna resposta e salva no banco.

Body recebido:

json
{
  "case_id": "uuid",
  "message": "Pode aprofundar o ponto sobre transferência?"
}
3. POST /onboarding/complete
Finaliza onboarding

O que faz: Salva perfil clínico da psicóloga e marca onboarding como completo.

Body recebido:

json
{
  "years_experience": "3-5",
  "patient_types": ["adultos", "casais"],
  "specialties": ["ansiedade", "depressão"],
  "main_approach": "TCC",
  "approach_description": "Trabalho com protocolo..."
}
4. GET /cases
Lista histórico de casos

Parâmetros:

?search=resistência
&approach=TCC
&tag=urgente
&page=1
&limit=10
Retorna:

json
{
  "cases": [...],
  "total": 47,
  "page": 1
}
5. GET /cases/:id
Busca caso individual com histórico de chat

Retorna:

json
{
  "case": { ...dados do caso... },
  "messages": [ ...histórico do chat... ]
}
6. PATCH /cases/:id
Atualiza notas ou tags de um caso

Body:

json
{
  "notes": "Na sessão seguinte ela abriu sobre o pai...",
  "tags": ["urgente", "encaminhamento"]
}
7. DELETE /cases/:id
Deleta caso — com soft delete

Não deleta de verdade do banco. Marca is_archived = true. Necessário pra LGPD — você precisa conseguir restaurar se ela pedir.

8. POST /stripe/create-checkout
Cria sessão de pagamento

O que faz: Recebe o plano escolhido, cria sessão no Stripe e retorna URL de checkout. Usuária é redirecionada pro Stripe pagar.

Body:

json
{
  "plan": "pro",
  "billing": "monthly"
}
Retorna:

json
{
  "checkout_url": "https://checkout.stripe.com/..."
}
9. POST /stripe/webhook
Recebe eventos do Stripe

O mais importante do sistema de pagamento. O Stripe manda eventos pra cá automaticamente quando algo acontece. Você escuta e age.

Eventos que precisa tratar:

Evento Stripe	O que fazer
checkout.session.completed	Ativar assinatura no banco
invoice.payment_succeeded	Renovar período, zerar analyses_used
invoice.payment_failed	Mudar status pra past_due, mandar email
customer.subscription.deleted	Cancelar assinatura, mudar plano pra free
10. POST /stripe/cancel-subscription
Cancela assinatura

Fluxo interno:

1. Recebe motivo do cancelamento
2. Cancela no Stripe (no fim do período atual)
3. Atualiza status no banco
4. Dispara email de confirmação
5. Opcional: oferece desconto antes de cancelar
11. GET /subscription/status
Retorna status atual da assinatura

Usado pelo frontend pra saber quantas análises restam, qual plano, quando renova.

Retorna:

json
{
  "plan": "pro",
  "status": "active",
  "analyses_used": 7,
  "analyses_limit": null,
  "renewal_date": "2024-02-15"
}
12. GET /library
Lista artigos da biblioteca

Parâmetros:

?search=transferência
&approach=Psicanálise
&theme=técnicas
13. POST /auth/delete-account
Deleta conta — fluxo LGPD

Fluxo:

1. Confirma senha
2. Cancela assinatura se ativa
3. Anonimiza dados pessoais (não deleta análises, anonimiza)
4. Deleta auth do Supabase
5. Envia email de confirmação
14. GET /admin/metrics (só você acessa)
Métricas do negócio

Retorna:

json
{
  "mrr": 19700,
  "active_users": 100,
  "churn_this_month": 3,
  "new_signups_this_month": 15,
  "total_analyses": 4820,
  "avg_analyses_per_user": 48.2
}
Sistema de Emails — Resend
Todos os emails disparados automaticamente:

Trigger	Email enviado
Cadastro	Boas-vindas + link pra completar onboarding
Primeiro pagamento	Confirmação + recibo
80% do limite usado	"Você usou 8 das 10 análises"
Pagamento falhou	Aviso com link pra atualizar cartão
Cancelamento	Confirmação + pesquisa de motivo
7 dias sem logar	"Tem um caso esperando por você"
Renovação 3 dias antes	Aviso de cobrança
Segurança — O Que Não Pode Esquecer
Row Level Security (RLS) no Supabase Cada psicóloga só acessa os próprios dados. Uma linha de configuração no Supabase garante isso. Não pode esquecer — é crítico.

sql
-- Exemplo na tabela cases
CREATE POLICY "Users can only see own cases"
ON cases FOR ALL
USING (auth.uid() = user_id);
Variáveis de ambiente — nunca no código

ANTHROPIC_API_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
SUPABASE_SERVICE_KEY
Rate limiting Limitar chamadas à /analyze-case pra evitar abuso. Supabase tem isso nativo.

Resumo de Todas as Rotas
Método	Rota	Função
POST	/analyze-case	Analisar caso com IA
POST	/chat-message	Chat sobre caso
POST	/onboarding/complete	Salvar perfil
GET	/cases	Listar casos
GET	/cases/:id	Buscar caso
PATCH	/cases/:id	Atualizar caso
DELETE	/cases/:id	Arquivar caso
POST	/stripe/create-checkout	Iniciar pagamento
POST	/stripe/webhook	Eventos Stripe
POST	/stripe/cancel-subscription	Cancelar plano
GET	/subscription/status	Status assinatura
GET	/library	Biblioteca clínica
POST	/auth/delete-account	Deletar conta
GET	/admin/metrics	Métricas admin

>>>>>>> e70404a (chore: initial commit — projeto PsiCoach AI)
