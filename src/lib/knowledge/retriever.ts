/**
 * Knowledge Retriever — PsiCoach AI
 *
 * Faz a seleção de trechos relevantes da base de conhecimento
 * com base em palavras-chave extraídas do texto do usuário e da
 * abordagem terapêutica escolhida. Injeta os trechos no system prompt
 * para enriquecer as respostas do modelo.
 */

import { approachesKnowledge } from './approaches';
import { diagnosticsKnowledge } from './diagnostics';
import { techniquesKnowledge } from './techniques';

/* ─────────────── section extraction ─────────────── */

interface KnowledgeSection {
  heading: string;
  content: string;
  keywords: string[];
}

/** Divide um bloco de conhecimento em seções pelo heading ## */
function parseSections(raw: string): KnowledgeSection[] {
  const sections: KnowledgeSection[] = [];
  const blocks = raw.split(/\n(?=##+ )/).filter(Boolean);

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    const heading = lines[0].replace(/^#+\s*/, '').trim();
    const content = block.trim();
    // gera keywords automáticas a partir do heading e dos sub-headings
    const subHeadings = lines
      .filter((l) => /^#+/.test(l))
      .map((l) => l.replace(/^#+\s*/, '').toLowerCase());
    const keywords = [heading.toLowerCase(), ...subHeadings];
    sections.push({ heading, content, keywords });
  }

  return sections;
}

const ALL_SECTIONS: KnowledgeSection[] = [
  ...parseSections(approachesKnowledge),
  ...parseSections(diagnosticsKnowledge),
  ...parseSections(techniquesKnowledge),
];

/* ─────────────── keyword maps ─────────────── */

/** Mapeia palavras-chave de entrada → seções da base */
const KEYWORD_MAP: Record<string, string[]> = {
  // abordagens
  tcc: ['TERAPIA COGNITIVO-COMPORTAMENTAL (TCC)'],
  'cognitivo-comportamental': ['TERAPIA COGNITIVO-COMPORTAMENTAL (TCC)'],
  cognitiva: ['TERAPIA COGNITIVO-COMPORTAMENTAL (TCC)'],
  beck: ['TERAPIA COGNITIVO-COMPORTAMENTAL (TCC)'],
  distorção: ['TERAPIA COGNITIVO-COMPORTAMENTAL (TCC)'],
  pensamento: ['TERAPIA COGNITIVO-COMPORTAMENTAL (TCC)', 'REESTRUTURAÇÃO COGNITIVA'],
  automático: ['TERAPIA COGNITIVO-COMPORTAMENTAL (TCC)', 'REESTRUTURAÇÃO COGNITIVA'],
  crença: ['TERAPIA COGNITIVO-COMPORTAMENTAL (TCC)', 'REESTRUTURAÇÃO COGNITIVA'],
  psicanálise: ['PSICANÁLISE E PSICOTERAPIA PSICANALÍTICA'],
  psicanalítica: ['PSICANÁLISE E PSICOTERAPIA PSICANALÍTICA'],
  freud: ['PSICANÁLISE E PSICOTERAPIA PSICANALÍTICA'],
  inconsciente: ['PSICANÁLISE E PSICOTERAPIA PSICANALÍTICA'],
  transferência: ['PSICANÁLISE E PSICOTERAPIA PSICANALÍTICA'],
  klein: ['PSICANÁLISE E PSICOTERAPIA PSICANALÍTICA'],
  winnicott: ['PSICANÁLISE E PSICOTERAPIA PSICANALÍTICA'],
  bowlby: ['PSICANÁLISE E PSICOTERAPIA PSICANALÍTICA'],
  apego: ['PSICANÁLISE E PSICOTERAPIA PSICANALÍTICA'],
  kohut: ['PSICANÁLISE E PSICOTERAPIA PSICANALÍTICA'],
  gestalt: ['GESTALT-TERAPIA'],
  contato: ['GESTALT-TERAPIA'],
  phenomenologia: ['GESTALT-TERAPIA'],
  rogers: ['ABORDAGEM HUMANISTA / CENTRADA NA PESSOA (Rogers)'],
  humanista: ['ABORDAGEM HUMANISTA / CENTRADA NA PESSOA (Rogers)'],
  empatia: ['ABORDAGEM HUMANISTA / CENTRADA NA PESSOA (Rogers)', 'ALIANÇA TERAPÊUTICA'],
  sistêmica: ['TERAPIA SISTÊMICA / FAMILIAR'],
  familiar: ['TERAPIA SISTÊMICA / FAMILIAR'],
  família: ['TERAPIA SISTÊMICA / FAMILIAR'],
  genograma: ['TERAPIA SISTÊMICA / FAMILIAR'],
  jung: ['PSICOLOGIA ANALÍTICA (JUNGUIANA)'],
  junguiana: ['PSICOLOGIA ANALÍTICA (JUNGUIANA)'],
  arquétipo: ['PSICOLOGIA ANALÍTICA (JUNGUIANA)'],
  sombra: ['PSICOLOGIA ANALÍTICA (JUNGUIANA)'],
  sonho: ['PSICOLOGIA ANALÍTICA (JUNGUIANA)', 'PSICANÁLISE E PSICOTERAPIA PSICANALÍTICA'],
  act: ['TERAPIA DE ACEITAÇÃO E COMPROMISSO (ACT)'],
  aceitação: ['TERAPIA DE ACEITAÇÃO E COMPROMISSO (ACT)'],
  valores: ['TERAPIA DE ACEITAÇÃO E COMPROMISSO (ACT)'],
  defusão: ['TERAPIA DE ACEITAÇÃO E COMPROMISSO (ACT)'],
  // diagnósticos
  ansiedade: ['TRANSTORNOS DE ANSIEDADE (DSM-5 Capítulo 5)', 'Transtorno de Ansiedade Generalizada (TAG) — F41.1'],
  tag: ['Transtorno de Ansiedade Generalizada (TAG) — F41.1'],
  pânico: ['Transtorno do Pânico — F41.0', 'TÉCNICAS DE EXPOSIÇÃO'],
  fobia: ['Fobia Social (Transtorno de Ansiedade Social) — F40.1', 'Fobia Específica — F40.2xx'],
  social: ['Fobia Social (Transtorno de Ansiedade Social) — F40.1'],
  depressão: ['TRANSTORNOS DEPRESSIVOS (DSM-5 Capítulo 4)', 'Transtorno Depressivo Maior (TDM) — F32.x / F33.x'],
  depressivo: ['TRANSTORNOS DEPRESSIVOS (DSM-5 Capítulo 4)', 'ATIVAÇÃO COMPORTAMENTAL'],
  distimia: ['Transtorno Depressivo Persistente (Distimia) — F34.1'],
  toc: ['TRANSTORNO OBSESSIVO-COMPULSIVO (TOC) — F42', 'TÉCNICAS DE EXPOSIÇÃO'],
  obsessivo: ['TRANSTORNO OBSESSIVO-COMPULSIVO (TOC) — F42'],
  compulsão: ['TRANSTORNO OBSESSIVO-COMPULSIVO (TOC) — F42', 'TRANSTORNOS ALIMENTARES'],
  trauma: ['TRANSTORNO DE ESTRESSE PÓS-TRAUMÁTICO (TEPT) — F43.1', 'TRABALHO COM TRAUMA (FUNDAMENTOS)'],
  tept: ['TRANSTORNO DE ESTRESSE PÓS-TRAUMÁTICO (TEPT) — F43.1', 'TRABALHO COM TRAUMA (FUNDAMENTOS)'],
  flashback: ['TRANSTORNO DE ESTRESSE PÓS-TRAUMÁTICO (TEPT) — F43.1'],
  emdr: ['TRABALHO COM TRAUMA (FUNDAMENTOS)', 'TRANSTORNO DE ESTRESSE PÓS-TRAUMÁTICO (TEPT) — F43.1'],
  personalidade: ['TRANSTORNOS DA PERSONALIDADE (DSM-5 Capítulo 17)'],
  borderline: ['TRANSTORNOS DA PERSONALIDADE (DSM-5 Capítulo 17)'],
  tpb: ['TRANSTORNOS DA PERSONALIDADE (DSM-5 Capítulo 17)'],
  dbt: ['TRANSTORNOS DA PERSONALIDADE (DSM-5 Capítulo 17)', 'REGULAÇÃO EMOCIONAL'],
  narcisista: ['TRANSTORNOS DA PERSONALIDADE (DSM-5 Capítulo 17)'],
  luto: ['TRANSTORNOS RELACIONADOS A TRAUMA E LUTO'],
  alimentar: ['TRANSTORNOS ALIMENTARES'],
  anorexia: ['TRANSTORNOS ALIMENTARES'],
  bulimia: ['TRANSTORNOS ALIMENTARES'],
  bipolar: ['TRANSTORNOS DO HUMOR BIPOLAR — F31.x'],
  suicid: ['AVALIAÇÃO DE RISCO SUICIDA'],
  autolesão: ['AVALIAÇÃO DE RISCO SUICIDA'],
  risco: ['AVALIAÇÃO DE RISCO SUICIDA', 'INTERVENÇÕES EM CRISE'],
  // técnicas
  mindfulness: ['MINDFULNESS E PRÁTICAS CONTEMPLATIVAS'],
  meditação: ['MINDFULNESS E PRÁTICAS CONTEMPLATIVAS'],
  regulação: ['REGULAÇÃO EMOCIONAL'],
  emoção: ['REGULAÇÃO EMOCIONAL'],
  exposição: ['TÉCNICAS DE EXPOSIÇÃO'],
  hierarquia: ['TÉCNICAS DE EXPOSIÇÃO'],
  ativação: ['ATIVAÇÃO COMPORTAMENTAL'],
  comportamental: ['ATIVAÇÃO COMPORTAMENTAL', 'TERAPIA COGNITIVO-COMPORTAMENTAL (TCC)'],
  reestruturação: ['REESTRUTURAÇÃO COGNITIVA'],
  assertividade: ['TÉCNICAS DE COMUNICAÇÃO E ASSERTIVIDADE'],
  comunicação: ['TÉCNICAS DE COMUNICAÇÃO E ASSERTIVIDADE'],
  sono: ['TÉCNICAS PARA SONO (HIGIENE DO SONO / TCC-I)', 'insônia'],
  insônia: ['TÉCNICAS PARA SONO (HIGIENE DO SONO / TCC-I)'],
  formulação: ['FORMULAÇÃO DE CASO TRANSDIAGNÓSTICA'],
  aliança: ['ALIANÇA TERAPÊUTICA'],
  vínculo: ['ALIANÇA TERAPÊUTICA'],
  crise: ['INTERVENÇÕES EM CRISE', 'AVALIAÇÃO DE RISCO SUICIDA'],
};

/* ─────────────── approach → sections mapping ─────────────── */

const APPROACH_SECTIONS: Record<string, string[]> = {
  tcc: ['TERAPIA COGNITIVO-COMPORTAMENTAL (TCC)'],
  psicanálise: ['PSICANÁLISE E PSICOTERAPIA PSICANALÍTICA'],
  psicanalítica: ['PSICANÁLISE E PSICOTERAPIA PSICANALÍTICA'],
  gestalt: ['GESTALT-TERAPIA'],
  humanista: ['ABORDAGEM HUMANISTA / CENTRADA NA PESSOA (Rogers)'],
  sistêmica: ['TERAPIA SISTÊMICA / FAMILIAR'],
  junguiana: ['PSICOLOGIA ANALÍTICA (JUNGUIANA)'],
  act: ['TERAPIA DE ACEITAÇÃO E COMPROMISSO (ACT)'],
};

/* ─────────────── retrieval function ─────────────── */

/** Retorna até maxSections trechos relevantes concatenados */
export function retrieveKnowledge(
  text: string,
  approach: string,
  maxSections = 5,
): string {
  const lower = text.toLowerCase();
  const approachLower = approach.toLowerCase();

  const relevantHeadings = new Set<string>();

  // 1. sempre incluir a seção da abordagem do terapeuta
  for (const [key, headings] of Object.entries(APPROACH_SECTIONS)) {
    if (approachLower.includes(key)) {
      headings.forEach((h) => relevantHeadings.add(h));
    }
  }

  // 2. keywords do texto do usuário
  for (const [kw, headings] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(kw)) {
      headings.forEach((h) => relevantHeadings.add(h));
    }
  }

  // 3. coletar seções correspondentes
  const matched: KnowledgeSection[] = [];
  for (const section of ALL_SECTIONS) {
    if (relevantHeadings.has(section.heading)) {
      matched.push(section);
    }
  }

  // 4. limitar ao teto de tokens razoável
  const selected = matched.slice(0, maxSections);

  if (selected.length === 0) return '';

  return (
    '---\n' +
    '## BASE DE CONHECIMENTO CLÍNICO RELEVANTE\n' +
    'Use as informações abaixo para fundamentar sua resposta:\n\n' +
    selected.map((s) => s.content).join('\n\n') +
    '\n---'
  );
}
