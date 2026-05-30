import Groq from 'groq-sdk';
import { CaseAnalysis, CaseContext } from '@/context/AppContext';

/* ─── singleton client ─── */
export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/* ─── model to use ─── */
export const GROQ_MODEL = 'llama-3.3-70b-versatile';

/* ─── shared system prompt ─── */
export function buildSystemPrompt(approach: string): string {
  return `Você é o PsiCoach AI, um copiloto clínico especializado em psicoterapia.
Seu papel é auxiliar psicólogos na formulação e supervisão de casos clínicos.
Você responde SEMPRE em português brasileiro, com linguagem técnica mas acessível.
A abordagem teórica preferencial do terapeuta é: ${approach || 'não especificada'}.
Adapte todo o vocabulário, os conceitos e as intervenções a essa abordagem.

Regras absolutas:
- Nunca diagnostique um paciente diretamente nem substitua a avaliação do clínico.
- Sempre enquadre respostas como hipóteses clínicas a serem validadas pelo terapeuta.
- Seja objetivo, fundamentado e cite referências bibliográficas reais quando mencionar literatura.
- Nunca invente autores ou obras que não existam.`;
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
  // strip possible markdown fences
  const clean = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim();

  const parsed = JSON.parse(clean);

  // minimal validation
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
