nenhuma e com bastante detalhes)

16:13
Arquitetura Completa de Páginas — PsiCoach AI 🗂️
Visão Geral da Estrutura
PsiCoach AI
│
├── Páginas Públicas (sem login)
│   ├── Landing Page
│   ├── Pricing
│   └── Login / Cadastro
│
├── Onboarding (primeiro acesso)
│   ├── Passo 1 — Perfil profissional
│   ├── Passo 2 — Abordagem teórica
│   └── Passo 3 — Tour guiado
│
├── App (logado)
│   ├── Dashboard
│   ├── Nova Análise
│   ├── Histórico de Casos
│   ├── Caso Individual
│   ├── Biblioteca Clínica
│   └── Configurações
│
└── Admin (você)
    ├── Painel de usuárias
    └── Métricas
PÁGINAS PÚBLICAS
1. Landing Page /
Objetivo: Converter visitante em cadastro. Essa é a página mais importante do produto.

Seções em ordem:

Hero

Headline principal forte. Exemplo: "Seu copiloto clínico. Disponível às 3 da manhã."
Subtítulo explicando em 1 frase o que faz
CTA principal: botão "Começar grátis por 7 dias"
Imagem/mockup da interface do produto
Barra de prova social

"Já usado por +X psicólogas no Brasil"
Logos de faculdades ou conselho (quando tiver)
Seção Problema

3 cards mostrando as dores: supervisão cara, não tem a quem recorrer, casos complexos travam
Linguagem emocional, não técnica
Seção Solução

GIF ou vídeo curto mostrando o produto funcionando
3 passos simples: Descreva o caso → Receba a análise → Aplique na sessão
Seção Features

4-6 cards com funcionalidades principais
Ícone + título + descrição curta cada
Seção Como Funciona

Timeline visual mostrando o fluxo completo
Exemplo real de input e output da IA (caso fictício)
Depoimentos

3 cards com foto, nome, especialidade e depoimento
(Usar depoimentos das betas quando tiver)
Seção Pricing resumida

Os 3 planos de forma simplificada
CTA em cada um
FAQ

6-8 perguntas frequentes
Especialmente: "Isso é reconhecido pelo CFP?", "Meus dados são seguros?"
Footer

Links institucionais
Redes sociais
Política de privacidade / Termos de uso
2. Página de Preços /pricing
Objetivo: Detalhar planos e converter em assinatura.

Conteúdo:

Toggle mensal/anual (anual com desconto de 20%)
3 cards de plano lado a lado
Starter R$97/mês
Pro R$197/mês (destacado como "mais popular")
Clínica R$397/mês
Tabela comparativa completa abaixo dos cards mostrando cada feature e quais planos têm
Seção "O que está incluído em todos os planos" (suporte, segurança, etc)
FAQ específico de pagamento: cancela quando quiser, como funciona cobrança, aceita quais cartões
CTA final com urgência suave
3. Login /login
Conteúdo:

Logo
Campo email
Campo senha
Botão entrar
Link "Esqueci minha senha"
Link "Não tem conta? Cadastre-se"
Opcional: login com Google
4. Cadastro /cadastro
Conteúdo:

Logo
Campo nome completo
Campo email
Campo CRP (número do conselho — gera confiança e filtra quem não é psicóloga)
Campo senha
Campo confirmar senha
Checkbox aceitar termos
Botão criar conta
Link "Já tem conta? Entre"
Após cadastro: Redireciona pro Onboarding

ONBOARDING
Aparece apenas no primeiro acesso. Barra de progresso no topo mostrando os passos.

5. Onboarding — Passo 1: Perfil /onboarding/perfil
Objetivo: Personalizar a IA pro perfil dela antes do primeiro uso.

Campos:

Anos de experiência clínica (select: 1-2 anos, 3-5 anos, 5-10 anos, +10 anos)
Tipo de atendimento (checkboxes: adultos, adolescentes, crianças, casais, grupos)
Especialidades (checkboxes: ansiedade, depressão, trauma, transtornos alimentares, etc)
Foto de perfil (opcional)
6. Onboarding — Passo 2: Abordagem Teórica /onboarding/abordagem
Objetivo: IA responder sempre dentro da abordagem que ela usa.

Conteúdo:

Título: "Qual sua principal abordagem teórica?"
Cards visuais para selecionar: Psicanálise, TCC, Humanista, Sistêmica, Gestalt, Junguiana, Integrativa, Outra
Campo texto: "Descreva sua abordagem se quiser ser mais específica"
Texto explicativo: "Usamos isso pra personalizar as análises pra você. Pode mudar depois."
7. Onboarding — Passo 3: Tour Guiado /onboarding/tour
Objetivo: Garantir que ela sabe usar o produto antes de sair.

Conteúdo:

Tela animada mostrando as 3 principais ações
Tooltip interativo no próprio app (overlay escuro com destaque na feature)
Ao final: botão "Fazer minha primeira análise" que leva direto pra página de Nova Análise
APP — ÁREA LOGADA
Todas as páginas têm sidebar fixa à esquerda com navegação.

Sidebar contém:

Logo
Avatar + nome da psicóloga
Menu: Dashboard, Nova Análise, Histórico, Biblioteca, Configurações
Indicador de plano atual + quantas análises restam no mês
Botão Sair
8. Dashboard /dashboard
Objetivo: Visão geral rápida. Primeira coisa que ela vê ao logar.

Seções:

Header personalizado

"Bom dia, Dra. Ana. Você tem 3 casos em aberto."
Cards de resumo rápido

Total de análises feitas
Análises restantes no mês
Casos salvos
Dias de assinatura ativa
Ação rápida em destaque

Botão grande: "+ Nova Análise"
Últimas análises

Lista dos últimos 5 casos com data, título do caso e abordagem usada
Botão ver todos
Dica clínica do dia

Card com uma citação ou insight clínico gerado pela IA
Muda todo dia
Pequeno toque de valor diário que cria hábito de abrir o app
Banner de upgrade (só pra plano Starter)

Suave, não invasivo: "Você usou 7 das 10 análises deste mês. Considere o plano Pro."
9. Nova Análise /nova-analise
Objetivo: Core do produto. Onde ela descreve o caso e recebe a análise da IA.

Layout: Dividido em 2 colunas em desktop. Em mobile empilhado.

Coluna esquerda — Input:

Título do caso (opcional, pra salvar depois)
Campo grande de texto: "Descreva o caso clínico..."
Placeholder com exemplo real pra guiar
Contador de caracteres (mínimo sugerido: 200 caracteres pra IA ter contexto)
Seção colapsável "Contexto adicional":
Número de sessões já realizadas
Diagnóstico atual se houver
O que já foi tentado
Qual é a dúvida específica dela
Toggle: "Usar minha abordagem padrão" ou "Escolher abordagem diferente pra esse caso"
Botão: "Analisar caso"
Coluna direita — Output:

Aparece após clicar em analisar. Loading com animação enquanto processa.

Resultado estruturado em seções com ícones:

🔍 Hipótese clínica — O que a IA identificou no caso
🛤️ Abordagens sugeridas — 2-3 caminhos possíveis com justificativa
❓ Perguntas para próxima sessão — Lista de 4-6 perguntas concretas
📚 Referências teóricas — Autores e conceitos relevantes com breve explicação
👁️ Ponto cego possível — O que ela pode não estar vendo
⚠️ Atenção — Sinais de alerta se houver (ex: risco, necessidade de encaminhamento)
Ações após análise:

Botão salvar caso
Botão copiar análise
Botão nova análise
Botão "Aprofundar um ponto" — abre chat livre sobre o caso
Seção de chat livre (aberta após análise)

Campo pra ela fazer perguntas específicas sobre o caso
IA responde em contexto com o que já foi analisado
Histórico da conversa visível
10. Histórico de Casos /historico
Objetivo: Ela encontrar e revisar análises antigas.

Conteúdo:

Barra de busca por palavra-chave
Filtros: data, abordagem usada, tag
Lista de casos em cards:
Título do caso
Data da análise
Abordagem utilizada
Tags que ela adicionou
Prévia das hipóteses
Botão ver caso completo
Paginação
Botão "+ Nova Análise" fixo no canto
11. Caso Individual /historico/:id
Objetivo: Visualizar análise completa de um caso salvo.

Conteúdo:

Header com título do caso, data, abordagem
Campo de notas da psicóloga (ela pode anotar o que aconteceu depois na sessão)
Análise completa da IA (mesmo formato da Nova Análise)
Histórico do chat se houver
Linha do tempo se ela fez múltiplas análises do mesmo caso
Botão "Fazer nova análise desse caso" (carrega contexto anterior automaticamente)
Botão deletar caso
12. Biblioteca Clínica /biblioteca
Objetivo: Entregar valor passivo. Ela abre o app mesmo sem ter caso pra analisar.

Conteúdo:

Buscador de conceitos clínicos
Cards de conteúdo gerado por IA:
"Como trabalhar resistência em TCC"
"Sinais de transferência em sessão"
"Quando encaminhar para psiquiatria"
Filtro por abordagem teórica
Filtro por tema: transtornos, técnicas, ética, desenvolvimento
Cada card abre artigo curto com profundidade clínica real
Botão "Perguntar sobre esse tema" que leva pra Nova Análise com contexto preenchido
13. Configurações /configuracoes
Abas:

Perfil

Editar nome, foto, email
Editar CRP
Editar especialidades e abordagem teórica
Assinatura

Plano atual
Data de renovação
Histórico de faturas
Botão mudar plano
Botão cancelar assinatura (com fluxo de retenção: pergunta o motivo, oferece desconto)
Preferências

Idioma da interface
Abordagem padrão pra análises
Nível de detalhe das respostas (conciso / detalhado)
Notificações por email
Segurança

Trocar senha
Autenticação em dois fatores
Sessões ativas
Privacidade e Dados

Explicação clara de como os dados são usados
Botão exportar todos os meus dados
Botão deletar conta (com confirmação)
ADMIN — SÓ VOCÊ ACESSA
14. Painel Admin /admin
Conteúdo:

Total de usuárias ativas
Receita mensal recorrente (MRR)
Churn do mês
Novas cadastradas vs cancelamentos
Lista de usuárias com plano, data de cadastro, último acesso
Botão impersonar usuária (pra debugar problema)
Resumo de todas as páginas
#	Página	Rota
1	Landing Page	/
2	Pricing	/pricing
3	Login	/login
4	Cadastro	/cadastro
5	Onboarding Perfil	/onboarding/perfil
6	Onboarding Abordagem	/onboarding/abordagem
7	Onboarding Tour	/onboarding/tour
8	Dashboard	/dashboard
9	Nova Análise	/nova-analise
10	Histórico	/historico
11	Caso Individual	/historico/:id
12	Biblioteca Clínica	/biblioteca
13	Configurações	/configuracoes
14	Admin	/admin
