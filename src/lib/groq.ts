import Groq from 'groq-sdk';
import { CaseAnalysis, CaseContext } from '@/context/AppContext';
import { retrieveKnowledge } from './knowledge/retriever';

/* ─── singleton client ─── */
export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/* ─── model to use ─── */
export const GROQ_MODEL = 'llama-3.3-70b-versatile';

/* ─── therapist profile shape (sent from frontend) ─── */
export interface TherapistProfile {
  approach: string;
  yearsExperience?: string;
  patientTypes?: string[];
  specialties?: string[];
  approachDescription?: string;
}

/* ─── experience-level adaptation ─── */
function buildExperienceBlock(yearsExperience?: string): string {
  const map: Record<string, string> = {
    '1-2': 'O terapeuta está no início da carreira (1-2 anos de clínica). Seja didático: explique os conceitos com mais detalhes, fundamente cada hipótese teoricamente e indique referências acessíveis. Evite jargões sem explicação.',
    '3-5': 'O terapeuta tem experiência intermediária (3-5 anos). Use terminologia técnica adequada e assuma familiaridade com conceitos básicos da abordagem. Seja preciso sem ser excessivamente introdutório.',
    '5-10': 'O terapeuta é experiente (5-10 anos de clínica). Use linguagem técnica avançada, vá direto ao ponto e ofereça análises sofisticadas. Pode mencionar debates ou variações dentro da abordagem.',
    '+10': 'O terapeuta é sênior (+10 anos). Use o nível técnico mais alto possível. Assuma domínio completo da teoria, foque em nuances clínicas e complexidades do caso. Discuta perspectivas alternativas, controvérsias e possíveis impasses terapêuticos quando pertinente.',
  };
  return map[yearsExperience ?? ''] ?? '';
}

/* ─── build personalized system prompt ─── */
export function buildSystemPrompt(profile: TherapistProfile, contextText = ''): string {
  const knowledgeBlock = retrieveKnowledge(contextText || profile.approach, profile.approach);

  const experienceBlock = buildExperienceBlock(profile.yearsExperience);

  const patientTypesLine = profile.patientTypes?.length
    ? `- Público atendido: ${profile.patientTypes.join(', ')}`
    : '';

  const specialtiesLine = profile.specialties?.length
    ? `- Especialidades clínicas: ${profile.specialties.join(', ')}`
    : '';

  const nuancesLine = profile.approachDescription?.trim()
    ? `- Nuances ou autores preferidos: ${profile.approachDescription.trim()}`
    : '';

  const profileBlock = [patientTypesLine, specialtiesLine, nuancesLine]
    .filter(Boolean)
    .join('\n');

  return `Você é o PsiCoach AI, um copiloto clínico especializado em psicoterapia.
Seu papel é auxiliar psicólogos na formulação e supervisão de casos clínicos.
Você responde SEMPRE em português brasileiro, com linguagem técnica mas acessível.

━━━ PERFIL DO TERAPEUTA QUE VOCÊ ESTÁ ASSISTINDO ━━━
- Abordagem teórica: ${profile.approach || 'não especificada'}
${profileBlock}

INSTRUÇÕES DE PERSONALIZAÇÃO:
${experienceBlock ? `• ${experienceBlock}` : ''}
${profile.patientTypes?.length ? `• Ajuste hipóteses e intervenções ao contexto de atendimento: ${profile.patientTypes.join(', ')}.` : ''}
${profile.specialties?.length ? `• Quando o caso apresentar elementos de ${profile.specialties.join(' ou ')}, aprofunde nessas áreas com precisão técnica.` : ''}
${nuancesLine ? `• Respeite as nuances teóricas informadas pelo terapeuta: ${profile.approachDescription}.` : ''}
• Adapte todo o vocabulário, os conceitos e as intervenções à abordagem: ${profile.approach || 'não especificada'}.

REGRAS ABSOLUTAS:
- Nunca diagnostique um paciente diretamente nem substitua a avaliação do clínico.
- Sempre enquadre respostas como hipóteses clínicas a serem validadas pelo terapeuta.
- Seja objetivo, fundamentado e cite referências bibliográficas reais quando mencionar literatura.
- Nunca invente autores ou obras que não existam.
- Ao mencionar técnicas e intervenções, prefira as descritas na base de conhecimento fornecida.

${knowledgeBlock}`;
}

/* ─── JSON schema instructions ─── */
export const JSON_SCHEMA_INSTRUCTIONS = `
Responda EXCLUSIVAMENTE com um objeto JSON válido, sem markdown, sem blocos de código, sem texto antes ou depois.
O JSON deve ter exatamente esta estrutura:
{
  "hypothesis": "string — hipótese clínica formulada na abordagem escolhida (2-4 parágrafos)",
  "approaches": ["string", "string", "string"] — array de 3 a 5 intervenções terapêuticas específicas e práticas,
  "questions": ["string", "string", "string"] — array de 3 a 5 perguntas terapêuticas para explorar com o paciente,
  "references": ["string", "string"] — array de 2 a 4 referências bibliográficas reais no formato: Autor (Ano). Título. Editora.,
  "blind_spot": "string — um ponto cego ou viés contratransferencial que o terapeuta deve observar",
  "alerts": ["string"] — array de 0 a 3 alertas clínicos relevantes (risco, urgência etc.). Pode ser array vazio []
}`;

/* ─── build user message for standard analysis ─── */
export function buildAnalysisUserMessage(
  inputText: string,
  context: CaseContext,
  title?: string,
): string {
  const lines: string[] = [];

  if (title) lines.push(`Identificação do caso: ${title}`);
  lines.push(`Relato clínico:\n${inputText}`);
  if (context.sessions_count) lines.push(`Sessões realizadas: ${context.sessions_count}`);
  if (context.current_diagnosis) lines.push(`Diagnóstico atual: ${context.current_diagnosis}`);
  if (context.already_tried) lines.push(`Já foi trabalhado: ${context.already_tried}`);
  if (context.specific_question) lines.push(`Dúvida específica do terapeuta: ${context.specific_question}`);

  return lines.join('\n');
}

/* ─── parse and validate the AI JSON response ─── */
export function parseAnalysisJson(raw: string): CaseAnalysis {
  const clean = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim();

  const parsed = JSON.parse(clean);

  if (
    typeof parsed.hypothesis !== 'string' ||
    !Array.isArray(parsed.approaches) ||
    !Array.isArray(parsed.questions) ||
    !Array.isArray(parsed.references) ||
    typeof parsed.blind_spot !== 'string' ||
    !Array.isArray(parsed.alerts)
  ) {
    throw new Error('Estrutura JSON inválida retornada pela IA.');
  }

  return parsed as CaseAnalysis;
}
