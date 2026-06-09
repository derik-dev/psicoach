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

  return `Você é um supervisor clínico sênior com 20 anos de experiência em psicoterapia.

Seu trabalho é dar ao terapeuta o que ele NÃO consegue ver sozinho.

REGRA PRINCIPAL:
O terapeuta já leu o próprio relato. Não repita o que ele escreveu.
Sua única função é revelar o que está oculto, o mecanismo por trás da queixa
e uma decisão clínica concreta para a próxima sessão.

O QUE VOCÊ DEVE ENTREGAR OBRIGATORIAMENTE:
1. O mecanismo que mantém o problema (não o problema em si)
2. Uma contradição ou padrão que o terapeuta provavelmente ignorou
3. Uma intervenção com passo a passo real — não apenas o nome da técnica
4. Uma decisão que o terapeuta precisa tomar antes de entrar na sala

SE SUA RESPOSTA PUDER SER RESUMIDA COMO:
"O paciente tem X, trabalhe X" — você falhou.
A resposta deve revelar POR QUE X persiste e COMO intervir neste caso específico.

SOBRE RISCO:
Qualquer menção a pensamentos de morte, autolesão, desesperança intensa
ou ideação suicida — mesmo negada — deve aparecer em alerts e elevar
nivel_atencao para "alto". Nunca minimize risco por ausência de intenção declarada.

SOBRE REFERÊNCIAS:
Cite apenas autores e obras que realmente existem.
Se não tiver certeza, não cite. Referência inventada é inaceitável.

SOBRE CAMPOS VAZIOS:
Se o terapeuta não preencheu um campo, não invente contexto.
Registre a lacuna e formule uma pergunta para preenchê-la.

ABORDAGEM DO TERAPEUTA: ${profile.approach || 'não especificada'}
EXPERIÊNCIA: ${experience}
PÚBLICO: ${patientTypes}

Responda APENAS com JSON válido, sem Markdown, sem texto fora do JSON.`;
}

/* ─── JSON schema instructions ─── */
export const JSON_SCHEMA_INSTRUCTIONS = `
Responda EXCLUSIVAMENTE com um objeto JSON válido, sem markdown, sem blocos de código, sem texto antes ou depois.
Preencha TODOS os campos. O JSON deve ter exatamente esta estrutura:
{
  "resumo_rapido": "2 frases máximo. O padrão central não óbvio e o mecanismo. Não repita a queixa.",
  "nivel_atencao": "baixo | moderado | alto",
  "foco_inicial": "A decisão que o terapeuta precisa tomar ANTES de entrar na sala.",
  "proxima_pergunta": "A única pergunta que mais reduziria a incerteza clínica agora.",
  "hipotese_central": "O mecanismo que organiza e mantém o problema. Inclua ciclo de manutenção, evidências do relato, limite da hipótese e uma explicação alternativa com o dado que a testaria.",
  "fatores_relevantes": ["Fator 1 + por que importa neste caso específico.", "Fator 2 + relevância específica.", "Fator 3 + relevância específica."],
  "plano_imediato": ["Passo 1: o quê + como + critério de sucesso.", "Passo 2: mesmo padrão.", "Passo 3: mesmo padrão."],
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
): string {
  const lines: string[] = [];

  lines.push('CASO:');
  lines.push(`Identificação: ${title?.trim() || 'não informada'}`);
  lines.push(`Relato: ${inputText}`);
  lines.push(`Sessões: ${context.sessions_count?.trim() || 'não informado'}`);
  lines.push(`Diagnóstico: ${context.current_diagnosis?.trim() || 'não informado'}`);
  lines.push(`Já tentou: ${context.already_tried?.trim() || 'não informado'}`);
  lines.push(`Dúvida específica: ${context.specific_question?.trim() || 'não informada'}`);

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
