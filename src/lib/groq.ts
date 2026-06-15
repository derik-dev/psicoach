import Groq from 'groq-sdk';
import { CaseAnalysis, CaseContext } from '@/context/AppContext';

/* ─── singleton client ─── */
export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/* ─── model to use ─── */
export const GROQ_MODEL = 'openai/gpt-oss-120b';

export const ANALYSIS_RESPONSE_FORMAT = {
  type: 'json_schema',
  json_schema: {
    name: 'clinical_analysis',
    strict: true,
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        resumo_rapido: { type: 'string' },
        nivel_atencao: { type: 'string', enum: ['baixo', 'moderado', 'alto'] },
        foco_inicial: { type: 'string' },
        proxima_pergunta: { type: 'string' },
        hipotese_central: { type: 'string' },
        fatores_relevantes: { type: 'array', items: { type: 'string' } },
        plano_imediato: { type: 'array', items: { type: 'string' } },
        perguntas_clinicas: { type: 'array', items: { type: 'string' } },
        blind_spot: { type: 'string' },
        alerts: { type: 'array', items: { type: 'string' } },
        risco_e_protecao: { type: 'string' },
        intervencoes: { type: 'string' },
        prontuario: { type: 'string' },
        referencias: { type: 'array', items: { type: 'string' } },
        sintese: { type: 'string' },
      },
      required: [
        'resumo_rapido',
        'nivel_atencao',
        'foco_inicial',
        'proxima_pergunta',
        'hipotese_central',
        'fatores_relevantes',
        'plano_imediato',
        'perguntas_clinicas',
        'blind_spot',
        'alerts',
        'risco_e_protecao',
        'intervencoes',
        'prontuario',
        'referencias',
        'sintese',
      ],
    },
  },
} as const;

/* ─── patient memory context (injected by server into the prompt) ─── */
export interface PatientMemoryContext {
  pseudonym: string;
  weeks_in_therapy: number;
  sessions_count: number;
  confirmed_hypotheses: string[];
  discarded_hypotheses: string[];
  what_worked: string[];
  what_didnt_work: string[];
  recurring_patterns: string[];
  central_themes: string[];
  attention_history: { session_number: number; level: string }[];
  // intake fields
  gender?: string;
  referral_source?: string;
  medication_use?: string;
  intake_sessions_count?: string;
  last_session_notes?: string;
  previous_relatos?: { session_number: number; input_text: string }[];
}

/* ─── therapist profile shape (sent from frontend) ─── */
export interface TherapistProfile {
  approach: string;
  yearsExperience?: string;
  patientTypes?: string[];
  specialties?: string[];
  approachDescription?: string;
  responseDetail?: 'conciso' | 'detalhado';
}

/* ─── build personalized system prompt ─── */
export function buildSystemPrompt(profile: TherapistProfile): string {
  const experience = profile.yearsExperience?.trim() || 'não informada';
  const patientTypes = profile.patientTypes?.length
    ? profile.patientTypes.join(', ')
    : 'não informado';

  return `Você é um supervisor clínico com 20 anos de experiência. Fala direto, sem enrolação.

Sua função é mostrar ao terapeuta o que ele não está vendo — o mecanismo por trás do problema, não o problema em si.

REGRA PRINCIPAL:
O terapeuta já leu o próprio relato. Não repita o que ele escreveu.
Vá direto ao que importa: por que o problema persiste e o que fazer na próxima sessão.

O QUE ENTREGAR:
1. O mecanismo que mantém o problema (não descreva o problema, explique o que o sustenta)
2. Um padrão ou contradição que o terapeuta provavelmente não notou
3. Uma intervenção concreta com passo a passo — não só o nome da técnica
4. Uma decisão clara para antes de entrar na sala

SE SUA RESPOSTA PUDER SER RESUMIDA COMO:
"O paciente tem X, trabalhe X" — você errou.
Mostre POR QUE X persiste e COMO intervir neste caso específico.

SOBRE RISCO:
Qualquer menção a morte, autolesão ou ideação suicida — mesmo negada — vai em alerts e eleva nivel_atencao para "alto". Sem exceção.

SOBRE REFERÊNCIAS:
Só cite autores e obras que realmente existem. Se não tiver certeza, não cite.

SOBRE CAMPOS VAZIOS:
Não invente contexto. Aponte a lacuna e pergunte o que falta.

TOM E ESTILO:
- Fale como um colega de confiança, não como um relatório clínico.
- Frases curtas. Sem jargão desnecessário — se usar um termo técnico, explique em seguida.
- Destaque com **negrito** o que é mais importante em cada bloco.
- hipotese_central: máximo 3 parágrafos curtos com linha em branco entre eles.
- plano_imediato: cada passo em no máximo 3 linhas.

ABORDAGEM DO TERAPEUTA: ${profile.approach || 'não especificada'}
EXPERIÊNCIA: ${experience}
PÚBLICO: ${patientTypes}

Responda APENAS com JSON válido, sem texto fora do JSON.
Dentro dos valores textuais, Markdown é permitido somente para **negrito** inline.
Não use títulos Markdown, listas Markdown ou blocos de código.`;
}

/* ─── JSON schema instructions ─── */
export const JSON_SCHEMA_INSTRUCTIONS = `
Responda EXCLUSIVAMENTE com um objeto JSON válido, sem blocos de código e sem texto antes ou depois.
Nos valores textuais, use Markdown somente para **negrito** inline.
Preencha TODOS os campos. O JSON deve ter exatamente esta estrutura:
{
  "resumo_rapido": "2 frases máximo. O padrão central não óbvio e o mecanismo. Não repita a queixa.",
  "nivel_atencao": "baixo | moderado | alto",
  "foco_inicial": "A decisão que o terapeuta precisa tomar ANTES de entrar na sala.",
  "proxima_pergunta": "A única pergunta que mais reduziria a incerteza clínica agora.",
  "hipotese_central": "No máximo 3 parágrafos curtos, separados por uma linha em branco. Explique o mecanismo que organiza e mantém o problema. Inclua ciclo de manutenção, evidências do relato, limite da hipótese e uma explicação alternativa com o dado que a testaria.",
  "fatores_relevantes": ["Fator 1 + por que importa neste caso específico.", "Fator 2 + relevância específica.", "Fator 3 + relevância específica."],
  "plano_imediato": ["Passo 1 em no máximo 3 linhas: o quê + como + critério de sucesso.", "Passo 2 no mesmo formato e limite.", "Passo 3 no mesmo formato e limite."],
  "perguntas_clinicas": ["Pergunta que testa a hipótese principal.", "Pergunta que testa a hipótese alternativa.", "Pergunta que preenche a lacuna mais decisória.", "Pergunta sobre padrão relacional ou histórico relevante.", "Pergunta que o terapeuta provavelmente evitaria fazer."],
  "blind_spot": "Como este terapeuta, com esta abordagem, pode estar sendo capturado por este caso. Baseado em elementos concretos do relato.",
  "alerts": [],
  "risco_e_protecao": "Três partes: (1) sinais de risco no relato, (2) fatores protetivos, (3) o que ainda precisa ser avaliado.",
  "intervencoes": "Para cada intervenção: alvo + passo a passo + racional clínico + como identificar resposta ou impasse.",
  "prontuario": "Formato SOAP. S: relato do paciente. O: observações factuais. A: hipótese como inferência. P: próximos passos concretos.",
  "referencias": ["Autor real (Ano). Título real. Editora real. Por que é relevante para este caso."],
  "sintese": "O insight menos óbvio do caso. Termina com uma decisão clínica direta."
}`;

/* ─── build user message for standard analysis ─── */
export function buildAnalysisUserMessage(
  inputText: string,
  context: CaseContext,
  title?: string,
  patientMemory?: PatientMemoryContext,
): string {
  const lines: string[] = [];

  if (patientMemory) {
    lines.push('MEMÓRIA DO PACIENTE:');
    lines.push(`Pseudônimo: ${patientMemory.pseudonym}`);
    if (patientMemory.gender) lines.push(`Gênero: ${patientMemory.gender}`);
    if (patientMemory.referral_source) lines.push(`Como chegou: ${patientMemory.referral_source}`);
    if (patientMemory.medication_use) lines.push(`Medicação psiquiátrica: ${patientMemory.medication_use}`);
    if (patientMemory.weeks_in_therapy > 0) {
      const weeks = patientMemory.weeks_in_therapy;
      const timeLabel = weeks >= 8 ? `${Math.round(weeks / 4)} meses` : `${weeks} semanas`;
      lines.push(`Em terapia há: ${timeLabel}`);
    }
    if (patientMemory.intake_sessions_count) lines.push(`Sessões informadas no cadastro: ${patientMemory.intake_sessions_count}`);
    lines.push(`Sessões realizadas: ${patientMemory.sessions_count}`);
    if (patientMemory.confirmed_hypotheses.length > 0)
      lines.push(`Hipóteses confirmadas: ${patientMemory.confirmed_hypotheses.join('; ')}`);
    if (patientMemory.discarded_hypotheses.length > 0)
      lines.push(`Hipóteses descartadas: ${patientMemory.discarded_hypotheses.join('; ')}`);
    if (patientMemory.what_worked.length > 0)
      lines.push(`O que funcionou: ${patientMemory.what_worked.join('; ')}`);
    if (patientMemory.what_didnt_work.length > 0)
      lines.push(`O que não funcionou: ${patientMemory.what_didnt_work.join('; ')}`);
    if (patientMemory.recurring_patterns.length > 0)
      lines.push(`Padrões recorrentes: ${patientMemory.recurring_patterns.join('; ')}`);
    if (patientMemory.central_themes.length > 0)
      lines.push(`Temas centrais: ${patientMemory.central_themes.join('; ')}`);
    if (patientMemory.attention_history.length > 0) {
      const histStr = patientMemory.attention_history
        .map(h => `Sessão ${h.session_number}: ${h.level}`)
        .join(' → ');
      lines.push(`Histórico de atenção: ${histStr}`);
    }
    if (patientMemory.last_session_notes?.trim())
      lines.push(`Nota da última sessão: ${patientMemory.last_session_notes.trim()}`);
    if (patientMemory.previous_relatos && patientMemory.previous_relatos.length > 0) {
      lines.push('');
      lines.push('RELATOS ANTERIORES:');
      for (const r of patientMemory.previous_relatos) {
        lines.push(`Sessão ${r.session_number}: ${r.input_text.trim()}`);
      }
    }
    lines.push('');
  }

  lines.push('CASO:');
  if (title?.trim()) lines.push(`Identificação: ${title.trim()}`);
  lines.push(`Relato: ${inputText}`);
  if (context.sessions_count?.trim()) lines.push(`Sessões: ${context.sessions_count.trim()}`);
  if (context.current_diagnosis?.trim()) lines.push(`Diagnóstico: ${context.current_diagnosis.trim()}`);
  if (context.already_tried?.trim()) lines.push(`Já tentou: ${context.already_tried.trim()}`);
  if (context.specific_question?.trim()) lines.push(`Dúvida específica: ${context.specific_question.trim()}`);

  return lines.join('\n');
}

/* ─── parse and validate the AI JSON response ─── */
export function parseAnalysisJson(raw: string): CaseAnalysis {
  const clean = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim();

  const parsed: Record<string, unknown> = JSON.parse(clean);

  const requiredStrings = [
    'blind_spot',
    'resumo_rapido',
    'foco_inicial',
    'proxima_pergunta',
    'hipotese_central',
    'sintese',
    'risco_e_protecao',
    'intervencoes',
    'prontuario',
  ] as const;
  const requiredArrays = [
    'referencias',
    'alerts',
    'fatores_relevantes',
    'plano_imediato',
    'perguntas_clinicas',
  ] as const;
  const attentionAliases: Record<string, CaseAnalysis['nivel_atencao']> = {
    baixo: 'baixo',
    baixa: 'baixo',
    moderado: 'moderado',
    moderada: 'moderado',
    alto: 'alto',
    alta: 'alto',
  };

  if (typeof parsed.nivel_atencao === 'string') {
    const normalizedAttention = attentionAliases[parsed.nivel_atencao.trim().toLowerCase()];
    if (normalizedAttention) parsed.nivel_atencao = normalizedAttention;
  }

  for (const field of requiredArrays) {
    if (typeof parsed[field] === 'string') {
      const value = parsed[field].trim();
      parsed[field] = value ? [value] : [];
    }
  }

  const invalidStrings = requiredStrings.filter(
    (field) => typeof parsed[field] !== 'string' || !parsed[field].trim(),
  );
  const invalidArrays = requiredArrays.filter(
    (field) => !Array.isArray(parsed[field]) || parsed[field].some((item: unknown) => typeof item !== 'string'),
  );
  const invalidAttention = !['baixo', 'moderado', 'alto'].includes(
    parsed.nivel_atencao as string,
  );

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    invalidStrings.length > 0 ||
    invalidArrays.length > 0 ||
    invalidAttention
  ) {
    const problems = [
      invalidStrings.length ? `strings: ${invalidStrings.join(', ')}` : '',
      invalidArrays.length ? `listas: ${invalidArrays.join(', ')}` : '',
      invalidAttention ? 'nivel_atencao' : '',
    ].filter(Boolean);
    throw new Error(`Estrutura JSON inválida retornada pela IA (${problems.join('; ')}).`);
  }

  parsed.hypothesis = parsed.hipotese_central;
  parsed.approaches = parsed.plano_imediato;
  parsed.questions = parsed.perguntas_clinicas;
  parsed.references = parsed.referencias;
  parsed.formulacao = parsed.hipotese_central;
  parsed.referencias_texto = (parsed.references as string[]).join('\n');
  parsed.tags = [];

  return parsed as unknown as CaseAnalysis;
}
