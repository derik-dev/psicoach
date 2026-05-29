# Etapa 1 - Base do Frontend

## Aviso importante

NAO APAGAR A ETAPA 1.

Esta etapa e a base visual inicial do frontend do PsiCoach AI. Qualquer proxima mudanca deve continuar a partir dela, sem remover ou reverter o que foi feito aqui, a menos que o dono do projeto peça explicitamente.

## Contexto definido

- O foco atual do projeto e o frontend.
- O banco/Supabase ja foi conectado, mas a prioridade desta etapa nao foi mexer no banco.
- O backend e as regras de banco ficam como contrato futuro.
- O produto e o PsiCoach AI, um copiloto clinico para psicologas.
- O posicionamento correto e "segunda opiniao / apoio clinico", nunca "supervisao oficial".

## Arquivos Markdown lidos

Foram lidos os arquivos principais do projeto:

- `AGENTS.md`
- `README.md`
- `CLAUDE.md`
- `arquitetura-geral.md`
- `arquitetura-front-end.md`
- `arquitetura-back-end.md`

Ponto importante do `AGENTS.md`: antes de escrever codigo Next.js, consultar a documentacao local em `node_modules/next/dist/docs/`, porque esta versao do Next pode ter mudancas relevantes.

## O que foi feito no hero

O hero da landing page foi refeito com base em uma referencia visual de SaaS moderno:

- Header no topo com logo, navegacao central em formato de capsula e CTA.
- Fundo azul claro com formas organicas laterais.
- Badge central "Copiloto clinico inteligente".
- Campo central em formato de capsula para rascunho de caso clinico.
- Linha de prova/conceitos no rodape do hero com abordagens clinicas.
- Conteudo adaptado para PsiCoach AI, nao para uma plataforma generica.

Depois, a tipografia principal foi ajustada seguindo a referencia enviada:

- Titulo gigante em estilo Helvetica/grotesca.
- Peso visual mais editorial.
- Linha apertada.
- Segunda linha em rosa forte `#ff0054`.
- Texto atual:
  - `Descreva. Analise. Acolha.`
  - `PsiCoach organiza o resto.`

## Arquivos alterados

### `src/app/page.tsx`

Alteracoes principais:

- Hero substituido por uma nova estrutura visual.
- Removido uso de `page.module.css`.
- Hero passou a usar classes globais:
  - `hero-shell`
  - `hero-plane`
  - `hero-left-shape`
  - `hero-right-shape`
  - `hero-headline`
  - `hero-spark-icon`

### `src/app/globals.css`

Alteracoes principais:

- Adicionados estilos globais do hero.
- Adicionada classe `.hero-headline` com stack:
  - `"Helvetica Neue", Helvetica, Arial, sans-serif`
- Adicionados tamanhos responsivos para o titulo.
- Adicionados estilos das formas organicas, fundo e icone do input.

### `src/app/page.module.css`

O arquivo foi removido.

Motivo: o `next dev` estava acusando erro de CSS Module:

`Transforming CSS failed - Selector is not pure`

Para resolver de forma estavel, os estilos do hero foram movidos para `globals.css`.

## Problema encontrado e resolvido

O navegador chegou a mostrar a pagina sem CSS aplicado. A causa nao era o design em si, mas o `next dev` preso no erro antigo do `page.module.css`.

Foi feito:

- Remocao do CSS Module.
- Migracao dos estilos para `globals.css`.
- Reinicio do servidor de desenvolvimento.
- Verificacao de que o CSS servido passou a conter Tailwind e as classes do hero.

## Validacao

O comando abaixo passou com sucesso:

```bash
npm run build
```

Resultado: build compilou sem erro de TypeScript ou Next.

## Regra para proximas etapas

Nao apagar, sobrescrever ou reverter a Etapa 1.

As proximas etapas devem melhorar a partir desta base:

- ajustar o hero visualmente;
- refinar tipografia;
- melhorar responsividade;
- evoluir secoes abaixo;
- conectar dados reais depois, quando fizer sentido.

Se algo precisar mudar, preservar a intencao da etapa 1: landing com identidade forte, tipografia de anuncio/editorial e conteudo do PsiCoach AI.
