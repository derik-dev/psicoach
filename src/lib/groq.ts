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
  responseDetail?: 'conciso' | 'detalhado';
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

  const detailInstruction = profile.responseDetail === 'conciso'
    ? 'Seja conciso, mas preserve mecanismo clínico, justificativa e próximos passos. Não reduza a resposta a rótulos ou listas genéricas.'
    : 'Entregue uma análise detalhada, priorizando profundidade clínica, encadeamento do caso e utilidade para a próxima sessão.';

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
• ${detailInstruction}

PADRÃO DE RACIOCÍNIO CLÍNICO:
- Não apenas resuma a queixa. Formule o que pode estar organizando e mantendo o problema neste caso específico.
- Conecte dados do relato em uma cadeia clínica: contexto/gatilho → significados ou processos → emoção/estado corporal → resposta/defesa/comportamento → consequência → manutenção.
- Diferencie claramente: dados observados no relato, inferências clínicas e informações ainda ausentes.
- Procure contradições, mudanças de padrão, ganhos secundários, esquivas, fatores relacionais e elementos protetivos quando houver base no relato.
- Considere ao menos uma explicação alternativa plausível e indique qual dado futuro ajudaria a distingui-la da hipótese principal.
- Priorize a dúvida específica do terapeuta. A análise deve ajudá-lo a tomar uma decisão clínica, não apenas descrever conceitos.

PADRÃO DE UTILIDADE:
- Toda intervenção deve informar alvo clínico, procedimento concreto, momento/ordem de uso e sinal observável de resposta.
- Se o terapeuta informou algo que já tentou, não repita a mesma conduta sem explicar qual ajuste técnico mudaria sua função ou execução.
- Toda pergunta deve ter alto ganho de informação: testar uma hipótese, esclarecer uma lacuna ou mudar a decisão clínica.
- Evite recomendações soltas como “trabalhar autoestima”, “fortalecer vínculo”, “fazer psicoeducação”, “reestruturar pensamentos”, “treinar assertividade” ou “realizar exposição gradual”. Só use esses termos quando disser exatamente o quê, como e para quê neste caso.
- Não repita a mesma ideia em campos diferentes. Cada campo deve acrescentar uma camada nova.
- Quando os dados não sustentarem uma conclusão, declare a lacuna e formule a pergunta necessária. Nunca complete o caso com fatos inventados.

REGRAS ABSOLUTAS:
- Nunca diagnostique um paciente diretamente nem substitua a avaliação do clínico.
- Sempre enquadre respostas como hipóteses clínicas a serem validadas pelo terapeuta.
- Seja objetivo, fundamentado e cite referências bibliográficas reais quando mencionar literatura.
- Nunca invente autores ou obras que não existam.
- Ao mencionar técnicas e intervenções, prefira as descritas na base de conhecimento fornecida.
- Não trate ausência de informação sobre risco como confirmação de ausência de risco. Registre o que apareceu no relato e o que ainda precisa ser avaliado.
- Não revele raciocínio interno passo a passo. Apresente apenas a formulação clínica final e suas justificativas sucintas.

${knowledgeBlock}`;
}

/* ─── JSON schema instructions ─── */
export const JSON_SCHEMA_INSTRUCTIONS = `
Responda EXCLUSIVAMENTE com um objeto JSON válido, sem markdown, sem blocos de código, sem texto antes ou depois.
Preencha TODOS os campos. O JSON deve ter exatamente esta estrutura:
{
  "hypothesis": "Formulação clínica principal em 2 a 4 parágrafos, ancorada em elementos concretos do relato, incluindo mecanismo de manutenção, incerteza e hipótese alternativa.",
  "approaches": ["Intervenção 1 com alvo + procedimento + finalidade + indicador de resposta.", "Intervenção 2 no mesmo padrão.", "Intervenção 3 no mesmo padrão."],
  "questions": ["Pergunta clínica específica 1.", "Pergunta clínica específica 2.", "Pergunta clínica específica 3."],
  "references": ["Autor (Ano). Título. Editora.", "Autor (Ano). Título. Editora."],
  "blind_spot": "Ponto cego clínico ou reação do terapeuta que pode enviesar a condução, com o que observar para detectá-lo.",
  "alerts": ["0 a 3 alertas baseados somente no relato. Use [] quando não houver sinais explícitos, sem afirmar que o risco foi totalmente descartado."],
  "resumo_rapido": "Síntese em 2 ou 3 frases: padrão central, possível mecanismo e impacto funcional. Não apenas repita a queixa.",
  "nivel_atencao": "baixo | moderado | alto",
  "foco_inicial": "Uma prioridade clínica decisória e específica para a próxima sessão, não apenas o nome de uma técnica.",
  "proxima_pergunta": "A única pergunta que mais reduziria a incerteza clínica agora.",
  "hipotese_central": "Formulação integrada em 1 a 3 parágrafos: evidências do relato, ciclo de manutenção, fatores de proteção, limites da hipótese e explicação alternativa.",
  "fatores_relevantes": ["Fator específico 1 + relevância clínica.", "Fator específico 2 + relevância clínica.", "Fator específico 3 + relevância clínica.", "Fator específico 4 + relevância clínica."],
  "plano_imediato": ["Passo 1: ação + objetivo + critério.", "Passo 2: ação + objetivo + critério.", "Passo 3: ação + objetivo + critério."],
  "perguntas_clinicas": ["Pergunta que testa a hipótese principal.", "Pergunta que testa a hipótese alternativa.", "Pergunta que esclarece uma lacuna decisória."],
  "tags": ["tag específica 1", "tag específica 2", "tag específica 3"],
  "sintese": "O insight clínico mais útil e menos óbvio do caso, incluindo a principal decisão sugerida para a condução.",
  "formulacao": "Formulação ampliada com predisponentes, precipitantes, perpetuadores, protetores, padrão relacional e hipótese alternativa. Marque explicitamente o que ainda é incerto.",
  "risco_e_protecao": "Separe sinais de risco observados, fatores protetivos observados e itens de risco ainda não avaliados. Não invente nem tranquilize sem dados.",
  "intervencoes": "Plano clínico sequenciado. Para cada intervenção, explique alvo, execução, racional na abordagem escolhida e como avaliar resposta ou impasse.",
  "prontuario": "Registro objetivo e ético em linguagem de prontuário, distinguindo relato do paciente, observações e plano. Não registre inferências como fatos.",
  "referencias_texto": "Lista comentada das referências usadas, explicando em uma frase a pertinência de cada uma para este caso."
}

CRITÉRIOS ANTES DE RESPONDER:
- Se um trecho servir para quase qualquer paciente, torne-o mais específico ou remova-o.
- Não use o nome de uma técnica como se fosse um plano completo.
- Não repita literalmente conteúdos entre hypothesis, hipotese_central, formulacao e sintese.
- Mantenha consistência entre nivel_atencao, alerts e risco_e_protecao.`;

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

  lines.push(
    'Tarefa: produza uma formulação que explique o funcionamento do caso, aponte o que ainda precisa ser discriminado e entregue um plano utilizável na próxima sessão.',
  );

  return lines.join('\n');
}

/* ─── parse and validate the AI JSON response ─── */
export function parseAnalysisJson(raw: string): CaseAnalysis {
  const clean = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim();

  const parsed = JSON.parse(clean);

  const requiredStrings = [
    'hypothesis',
    'blind_spot',
    'resumo_rapido',
    'foco_inicial',
    'proxima_pergunta',
    'hipotese_central',
    'sintese',
    'formulacao',
    'risco_e_protecao',
    'intervencoes',
    'prontuario',
    'referencias_texto',
  ] as const;
  const requiredArrays = [
    'approaches',
    'questions',
    'references',
    'alerts',
    'fatores_relevantes',
    'plano_imediato',
    'perguntas_clinicas',
    'tags',
  ] as const;
  const validAttentionLevels = ['baixo', 'moderado', 'alto'];

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    requiredStrings.some((field) => typeof parsed[field] !== 'string') ||
    requiredArrays.some(
      (field) => !Array.isArray(parsed[field]) || parsed[field].some((item: unknown) => typeof item !== 'string'),
    ) ||
    !validAttentionLevels.includes(parsed.nivel_atencao)
  ) {
    throw new Error('Estrutura JSON inválida retornada pela IA.');
  }

  return parsed as CaseAnalysis;
}
