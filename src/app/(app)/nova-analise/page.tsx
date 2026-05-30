'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp, CaseAnalysis } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import {
  Brain,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Play,
  RotateCcw,
  Copy,
  Send,
  User,
  Bot,
  AlertTriangle,
  HelpCircle,
  BookOpen,
  Eye,
  FileText,
  TrendingUp,
  CheckCircle,
  Sparkle
} from 'lucide-react';

const SAMPLES = [
  {
    title: 'Caso Exemplo: Ansiedade Social (TCC)',
    text: 'Paciente de 28 anos, assistente administrativo, relata ansiedade extrema ao falar em público ou em reuniões de equipe. Apresenta taquicardia, sudorese e tremores nas mãos quando precisa se expressar. O principal pensamento disfuncional é: "Se eu falhar ou demonstrar nervosismo, serei demitido imediatamente porque vão achar que sou incompetente". Tem comportamentos de segurança como falar o mínimo possível e segurar a caneta com muita força para disfarçar tremores. Abordagem preferida: TCC.',
    approach: 'TCC (Terapia Cognitivo-Comportamental)',
    sessions: '1-5',
    diagnosis: 'F40.1 (Fobia Social)',
    alreadyTried: 'Psicoeducação sobre o modelo de ansiedade social.',
    question: 'Como estruturar experimentos comportamentais de exposição viáveis para o ambiente de trabalho?'
  },
  {
    title: 'Caso Exemplo: Depressão e Culpa (Psicanálise)',
    text: 'Paciente de 35 anos, sexo feminino, relata apatia severa, perda de energia e choro sem motivo aparente nos últimos 6 meses. O quadro iniciou após ser promovida no trabalho, uma posição que ela desejava há anos. Relata culpa constante por não se sentir feliz com a conquista, expressando a frase: "Eu não mereço estar aqui, outras pessoas na empresa são muito melhores do que eu". Na infância, ocupava a posição de cuidadora de uma mãe cronicamente doente que desvalorizava as suas conquistas intelectuais. Abordagem preferida: Psicanálise.',
    approach: 'Psicanálise',
    sessions: '5-10',
    diagnosis: 'F32.1 (Episódio Depressivo Moderado)',
    alreadyTried: 'Associação livre, investigando a infância.',
    question: 'Como articular o ganho secundário da depressão com a culpa inconsciente ligada ao sucesso?'
  },
  {
    title: 'Caso Exemplo: Conflito de Casal (Sistêmica)',
    text: 'Paciente de 39 anos relata alto sofrimento devido a brigas constantes com o cônjuge. Diz que sente-se "invisível e sobrecarregado" na relação, enquanto o cônjuge reclama de "cobrança e controle excessivos". Descreve um padrão repetitivo de perseguição-distanciamento. Ambos trabalham em período integral e têm dois filhos pequenos. Abordagem preferida: Sistêmica.',
    approach: 'Sistêmica',
    sessions: '1-5',
    diagnosis: 'Z63.0 (Problemas de Relacionamento)',
    alreadyTried: 'Tentar conversar calmamente durante finais de semana.',
    question: 'Como romper a circularidade da dança interativa de perseguição-distanciamento?'
  }
];

export default function NovaAnalise() {
  const { user, addCase } = useApp();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [inputText, setInputText] = useState('');
  const [sessionsCount, setSessionsCount] = useState('1-5');
  const [currentDiagnosis, setCurrentDiagnosis] = useState('');
  const [alreadyTried, setAlreadyTried] = useState('');
  const [specificQuestion, setSpecificQuestion] = useState('');
  const [customApproach, setCustomApproach] = useState('');
  const [useCustomApproach, setUseCustomApproach] = useState(false);

  const [contextExpanded, setContextExpanded] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedCaseId, setAnalyzedCaseId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<CaseAnalysis | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [, setSaveSuccess] = useState(false);

  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant', text: string }>>([]);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && !useCustomApproach) {
      setCustomApproach(user.mainApproach);
    }
  }, [user, useCustomApproach]);

  const handleSelectSample = (sample: typeof SAMPLES[0]) => {
    setTitle(sample.title.replace('Caso Exemplo: ', ''));
    setInputText(sample.text);
    setSessionsCount(sample.sessions);
    setCurrentDiagnosis(sample.diagnosis);
    setAlreadyTried(sample.alreadyTried);
    setSpecificQuestion(sample.question);
    setCustomApproach(sample.approach);
    setUseCustomApproach(true);
    setContextExpanded(true);
  };

  const handleReset = () => {
    setTitle('');
    setInputText('');
    setSessionsCount('1-5');
    setCurrentDiagnosis('');
    setAlreadyTried('');
    setSpecificQuestion('');
    setUseCustomApproach(false);
    setCustomApproach(user?.mainApproach || 'TCC');
    setAnalysisResult(null);
    setAnalyzedCaseId(null);
    setChatHistory([]);
  };

  const generateAnalysis = (text: string, approach: string): CaseAnalysis => {
    const isTCC = approach.toLowerCase().includes('tcc') || approach.toLowerCase().includes('cognitivo');
    const isPsicanalise = approach.toLowerCase().includes('psican') || approach.toLowerCase().includes('freud');

    if (isTCC) {
      return {
        hypothesis: `Com base na TCC, o caso descreve um quadro estruturado sobre pensamentos automáticos catastrofizantes de desempenho e inadequação social. A tríade cognitiva está direcionada ao autoconceito de incapacidade e a suposições rígidas. A esquiva ativa e comportamentos de segurança sutis servem para amortecer a ansiedade no curto prazo, mas mantêm as crenças nucleares disfuncionais.`,
        approaches: [
          'Flexibilização de pensamentos automáticos através do registro e questionamento socrático.',
          'Planejamento de Experimentos Comportamentais graduais de exposição.',
          'Mapeamento e retirada sistemática de Comportamentos de Segurança.'
        ],
        questions: [
          'Se você cometesse um erro leve em uma reunião, o que exatamente seus colegas pensariam?',
          'Onde você aprendeu a regra de que errar é sinônimo de total incapacidade?',
          'Como podemos testar, de maneira segura, o abandono gradual dos comportamentos de proteção?'
        ],
        references: [
          'Beck, J. S. (2021). Terapia Cognitivo-Comportamental: Teoria e Prática. Artmed.',
          'Clark, D. M., & Wells, A. (1995). A cognitive model of social phobia.'
        ],
        blind_spot: 'Racionalizar demais a ansiedade com o paciente. A TCC exige mudança afetivo-emocional e comportamental in loco.',
        alerts: [
          'Monitorar ataques de pânico antecipatórios.',
          'Avaliar comorbidade depressiva se o paciente começar a se isolar totalmente.'
        ]
      };
    } else if (isPsicanalise) {
      return {
        hypothesis: `O caso indica uma economia psíquica sob o jugo de um Superego severo e punitivo. A eclosão dos sintomas após uma conquista ilustra a dinâmica melancólica dos "arruinados pelo êxito". O sucesso evoca culpa inconsciente, fantasiado como traição edípica.`,
        approaches: [
          'Trabalho de Associação Livre centrado na culpa pelo sucesso.',
          'Análise da Transferência observando projeções da cobrança materna.',
          'Construção e Elaboração da história do desejo da paciente.'
        ],
        questions: [
          'Quem você sente que está traindo ao ser bem-sucedida e feliz?',
          'A quem se dirige a queixa "eu não mereço estar aqui"?',
          'O que aconteceria com a imagem de sua mãe se você se permitisse ser mais próspera que ela?'
        ],
        references: [
          'Freud, S. (1916). Alguns Tipos de Caráter Encontrados na Prática Psicanalítica.',
          'Lacan, J. (1957-1958). Seminário 5: As Formações do Inconsciente.'
        ],
        blind_spot: 'Adotar uma postura reconfortante e pedagógica. Isso fortifica a resistência superegóica e ignora a necessidade estrutural de punição.',
        alerts: [
          'Risco de atuação ou autossabotagem acentuada.',
          'Sintomas somáticos como expressão da agressividade voltada contra si.'
        ]
      };
    } else {
      return {
        hypothesis: `Sob a ótica sistêmica, a problemática reflete uma disfuncionalidade nos padrões de comunicação e na circularidade interativa do sistema conjugal. O casal está aprisionado em um ciclo Perseguidor-Distanciador.`,
        approaches: [
          'Mapeamento Circular em sessão.',
          'Prescrição de Tarefa Paradoxal.',
          'Redefinição Positiva da intenção de ambos.'
        ],
        questions: [
          'Quando um se cala, o que o outro sente que precisa fazer para não ser abandonado?',
          'Como era o modelo de casamento dos pais de cada um?',
          'Se esse ciclo sumisse hoje, o que restaria do relacionamento?'
        ],
        references: [
          'Watzlawick, P. et al. (1967). Pragmática da Comunicação Humana.',
          'Minuchin, S. (1974). Famílias e Casais.'
        ],
        blind_spot: 'Aliar-se a um dos cônjuges. Na visão sistêmica, o cliente é a relação.',
        alerts: [
          'Escalada de violência verbal.',
          'Triangulação dos filhos.'
        ]
      };
    }
  };

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText || inputText.trim().length < 10) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);

    setTimeout(async () => {
      const approach = useCustomApproach ? customApproach : (user?.mainApproach || 'TCC');
      const mockResult = generateAnalysis(inputText, approach);

      const newCase = await addCase(
        title || `Caso ${new Date().toLocaleDateString('pt-BR')}`,
        inputText,
        approach,
        {
          sessions_count: sessionsCount,
          current_diagnosis: currentDiagnosis,
          already_tried: alreadyTried,
          specific_question: specificQuestion
        },
        mockResult
      );

      setAnalysisResult(mockResult);
      setAnalyzedCaseId(newCase.id);
      setIsAnalyzing(false);
      setSaveSuccess(true);

      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }, 2500);
  };

  const handleCopyText = () => {
    if (!analysisResult) return;
    const text = `PsiCoach AI - Análise
Caso: ${title || 'Caso Clínico'}
Abordagem: ${useCustomApproach ? customApproach : user?.mainApproach}

HIPÓTESE
${analysisResult.hypothesis}

ABORDAGENS
${analysisResult.approaches.map((a, i) => `${i + 1}. ${a}`).join('\n')}

PERGUNTAS
${analysisResult.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

REFERÊNCIAS
${analysisResult.references.map((r, i) => `${i + 1}. ${r}`).join('\n')}

PONTO CEGO
${analysisResult.blind_spot}

ALERTAS
${analysisResult.alerts.map((a) => `- ${a}`).join('\n')}
`;
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !analyzedCaseId) return;

    const userText = chatMessage;
    setChatMessage('');
    setChatHistory((prev) => [...prev, { role: 'user', text: userText }]);
    setIsSendingMessage(true);

    setTimeout(() => {
      let botResponse = '';
      if (userText.toLowerCase().includes('transferencia') || userText.toLowerCase().includes('transferência')) {
        botResponse = 'Na clínica sob transferência, recomendo observar como o paciente projeta em você as demandas de aprovação infantil.';
      } else if (userText.toLowerCase().includes('resistencia') || userText.toLowerCase().includes('resistência')) {
        botResponse = 'A resistência sinaliza que nos aproximamos de um núcleo doloroso. Valide a dor antes de insistir na exposição.';
      } else {
        botResponse = 'Considerando a abordagem escolhida, recomendo desacelerar o ritmo e permitir que o paciente explore essa dúvida em primeira pessoa.';
      }

      setChatHistory((prev) => [...prev, { role: 'assistant', text: botResponse }]);
      setIsSendingMessage(false);

      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, 1500);
  };

  // Avoid TS unused warning
  void router;

  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <h1 className="page-headline">
          Nova <span className="page-headline-accent">análise.</span>
        </h1>
        <p className="text-slate-500 text-sm max-w-xl">
          Forneça as anotações e nuances do paciente. A IA estruturará o caso sob um olhar científico e analítico.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* LEFT: Input form */}
        <div className="space-y-5 bg-white border border-slate-100 rounded-3xl shadow-sm p-6 lg:p-7">
          {(!inputText || inputText.length === 0) && (
            <div className="space-y-3">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Casos de teste</span>
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {SAMPLES.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSample(sample)}
                    className="p-3 text-left rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 text-[11.5px] font-medium text-slate-600 hover:text-blue-700 leading-snug transition-all"
                  >
                    {sample.title.replace('Caso Exemplo: ', '')}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleAnalyze} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Pseudônimo (opcional)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Caso G. - Fobia Social"
                className="w-full bg-white border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                  <span>Relato clínico</span>
                  <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  {inputText.length} car. ({'>'}200 recomendado)
                </span>
              </div>
              <textarea
                required
                rows={10}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Insira queixas do paciente, verbalizações importantes, comportamento observado, histórico relevante..."
                className="w-full bg-white border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-2xl px-4 py-3.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all resize-y leading-relaxed"
              />
            </div>

            {/* Context collapsible */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/40">
              <button
                type="button"
                onClick={() => setContextExpanded(!contextExpanded)}
                className="w-full px-4 py-3 bg-white hover:bg-slate-50 flex items-center justify-between text-[11px] font-semibold text-slate-600 uppercase tracking-widest transition-colors"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Configurações adicionais</span>
                </span>
                {contextExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {contextExpanded && (
                <div className="p-4 border-t border-slate-100 space-y-4 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Sessões realizadas</label>
                      <select
                        value={sessionsCount}
                        onChange={(e) => setSessionsCount(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-blue-400 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none"
                      >
                        <option value="1-5">Acolhimento inicial (1-5)</option>
                        <option value="5-10">Aliança terapêutica (5-10)</option>
                        <option value="10-20">Processamento (10-20)</option>
                        <option value="20-50">Elaboração tardia (20-50)</option>
                        <option value="+50">Longa duração (+50)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Diagnóstico</label>
                      <input
                        type="text"
                        value={currentDiagnosis}
                        onChange={(e) => setCurrentDiagnosis(e.target.value)}
                        placeholder="Ex: F41.1 (TAG)"
                        className="w-full bg-white border border-slate-200 focus:border-blue-400 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">O que já foi trabalhado?</label>
                    <input
                      type="text"
                      value={alreadyTried}
                      onChange={(e) => setAlreadyTried(e.target.value)}
                      placeholder="Ex: Psicoeducação do pânico..."
                      className="w-full bg-white border border-slate-200 focus:border-blue-400 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Dúvida específica</label>
                    <input
                      type="text"
                      value={specificQuestion}
                      onChange={(e) => setSpecificQuestion(e.target.value)}
                      placeholder="Ex: Como lidar com a racionalização?"
                      className="w-full bg-white border border-slate-200 focus:border-blue-400 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-[13px] font-semibold text-slate-800">Diretriz teórica</h4>
                  <p className="text-[10px] text-slate-400">O vocabulário se adapta à escolha.</p>
                </div>
                <div className="flex items-center">
                  <input
                    id="override-approach"
                    type="checkbox"
                    checked={useCustomApproach}
                    onChange={(e) => setUseCustomApproach(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="override-approach" className="ml-2 text-xs font-semibold text-blue-600 cursor-pointer">
                    Mudar
                  </label>
                </div>
              </div>

              {!useCustomApproach ? (
                <div className="flex items-center gap-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 p-2.5 rounded-xl">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Padrão: {user?.mainApproach}</span>
                </div>
              ) : (
                <select
                  value={customApproach}
                  onChange={(e) => setCustomApproach(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-blue-400 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none"
                >
                  <option value="TCC (Terapia Cognitivo-Comportamental)">TCC</option>
                  <option value="Psicanálise">Psicanálise</option>
                  <option value="Humanista / Fenomenologia">Humanista</option>
                  <option value="Sistêmica / Terapia Familiar">Sistêmica</option>
                  <option value="Gestalt-terapia">Gestalt</option>
                  <option value="Junguiana / Psicologia Analítica">Junguiana</option>
                </select>
              )}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-3 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-semibold transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Limpar</span>
              </button>

              <button
                type="submit"
                disabled={inputText.trim().length < 10 || isAnalyzing}
                className="flex-[2] inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all shadow-[0_12px_28px_rgba(37,99,235,0.28)] hover:-translate-y-0.5"
              >
                {isAnalyzing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Gerar Análise</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT: Output */}
        <div className="space-y-6">
          {!isAnalyzing && !analysisResult ? (
            <div className="h-[580px] rounded-3xl border border-dashed border-slate-200 bg-white flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-[0_12px_28px_rgba(37,99,235,0.28)]">
                <Brain className="w-7 h-7" />
              </div>
              <div className="space-y-2 max-w-sm">
                <h3 className="text-base font-semibold text-slate-800">Dossiê vazio</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">
                  Digite seu relato e clique em <strong className="text-slate-700">Gerar Análise</strong>. O copiloto formulará a hipótese e indicará eixos terapêuticos.
                </p>
              </div>
            </div>
          ) : isAnalyzing ? (
            <div className="h-[580px] rounded-3xl border border-slate-100 bg-white shadow-sm flex flex-col items-center justify-center text-center p-8 space-y-5">
              <div className="relative">
                <div className="absolute -inset-4 rounded-full bg-blue-100 blur-2xl animate-ping" />
                <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center relative">
                  <Brain className="w-8 h-8 animate-pulse" />
                </div>
              </div>
              <div className="space-y-2 max-w-sm">
                <span className="section-badge">Processando</span>
                <h3 className="text-base font-semibold text-slate-800 mt-2">Tecendo formulações clínicas...</h3>
                <p className="text-[12px] text-slate-500 leading-relaxed">
                  Mapeando afetos e estruturação psíquica no modelo de <span className="text-blue-600 font-semibold">{useCustomApproach ? customApproach : user?.mainApproach}</span>.
                </p>
              </div>
              <div className="w-40 bg-slate-100 rounded-full h-1 overflow-hidden">
                <div className="h-full rounded-full bg-blue-600 animate-pulse" style={{ width: '70%' }} />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-7 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <div>
                      <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-widest block">Dossiê</span>
                      <h3 className="text-[12px] font-semibold text-slate-600">Formulação Completa</h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyText}
                      className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 text-slate-600 hover:text-blue-700 transition-all flex items-center gap-1.5 text-xs font-semibold"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copySuccess ? 'Copiado' : 'Copiar'}</span>
                    </button>

                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100 flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Salvo</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-6 max-h-[480px] overflow-y-auto pr-1">
                  <section className="space-y-2">
                    <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <span className="p-1 rounded bg-blue-50 text-blue-600"><Brain className="w-3.5 h-3.5" /></span>
                      <span>Hipótese Clínica</span>
                    </h4>
                    <p className="text-[13px] leading-relaxed text-slate-700 p-4 bg-slate-50 border border-slate-100 rounded-2xl italic" style={{ fontFamily: 'Georgia, serif' }}>
                      {analysisResult?.hypothesis}
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <span className="p-1 rounded bg-emerald-50 text-emerald-600"><TrendingUp className="w-3.5 h-3.5" /></span>
                      <span>Intervenções</span>
                    </h4>
                    <div className="space-y-2">
                      {analysisResult?.approaches.map((app, idx) => (
                        <div key={idx} className="flex gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] text-slate-600">
                          <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                            {idx + 1}
                          </span>
                          <p className="leading-relaxed">{app}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-2">
                    <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <span className="p-1 rounded bg-amber-50 text-amber-500"><HelpCircle className="w-3.5 h-3.5" /></span>
                      <span>Eixos de Questionamento</span>
                    </h4>
                    <div className="space-y-2">
                      {analysisResult?.questions.map((q, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] text-slate-700 italic" style={{ fontFamily: 'Georgia, serif' }}>
                          "{q}"
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-2">
                    <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <span className="p-1 rounded bg-emerald-50 text-emerald-600"><BookOpen className="w-3.5 h-3.5" /></span>
                      <span>Literatura</span>
                    </h4>
                    <div className="space-y-1.5">
                      {analysisResult?.references.map((ref, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded-xl text-[12px] text-slate-600 flex gap-2 border border-slate-100">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{ref}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-2">
                    <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <span className="p-1 rounded bg-sky-50 text-sky-600"><Eye className="w-3.5 h-3.5" /></span>
                      <span>Pontos Cegos</span>
                    </h4>
                    <p className="text-[13px] leading-relaxed text-slate-600 p-4 bg-slate-50 border border-slate-100 rounded-2xl border-l-4 border-l-blue-600">
                      {analysisResult?.blind_spot}
                    </p>
                  </section>

                  {analysisResult?.alerts && analysisResult.alerts.length > 0 && (
                    <section className="space-y-2">
                      <h4 className="text-[10px] font-semibold text-rose-600 uppercase tracking-widest flex items-center gap-2">
                        <span className="p-1 rounded bg-rose-50 text-rose-500"><AlertTriangle className="w-3.5 h-3.5" /></span>
                        <span>Alertas</span>
                      </h4>
                      <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl space-y-2">
                        {analysisResult.alerts.map((al, idx) => (
                          <div key={idx} className="text-[13px] text-rose-700 leading-relaxed flex gap-2">
                            <span className="font-bold">•</span>
                            <span>{al}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </div>

              {/* Chat */}
              <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-4">
                <div className="space-y-1">
                  <h4 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                    <Sparkle className="w-4 h-4 text-blue-600" />
                    <span>Aprofundar</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Debata contratransferência, resistências específicas e intervenções complementares.
                  </p>
                </div>

                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {chatHistory.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-5">
                      Exemplo: "Como manejar a transferência na próxima sessão?"
                    </p>
                  ) : (
                    chatHistory.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex gap-2.5 p-3.5 rounded-2xl text-[12.5px] max-w-[92%] leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white ml-auto flex-row-reverse rounded-tr-sm'
                            : 'bg-slate-50 border border-slate-100 text-slate-700 mr-auto rounded-tl-sm'
                        }`}
                      >
                        <div className={`p-1.5 rounded-xl shrink-0 h-7 w-7 flex items-center justify-center ${
                          msg.role === 'user' ? 'bg-white/20 text-white' : 'bg-white text-blue-600 border border-slate-100'
                        }`}>
                          {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                        </div>
                        <div className="space-y-0.5">
                          <p className="whitespace-pre-line">{msg.text}</p>
                        </div>
                      </div>
                    ))
                  )}

                  {isSendingMessage && (
                    <div className="flex gap-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 mr-auto max-w-[92%]">
                      <div className="p-1.5 rounded-xl bg-white text-blue-600 border border-slate-100 h-7 w-7 flex items-center justify-center">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex items-center gap-1 py-1">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2 items-center bg-slate-50 border border-slate-100 rounded-full p-1.5 pl-4 focus-within:ring-2 focus-within:ring-blue-200">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Refine a intervenção..."
                    className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none min-w-0"
                  />
                  <button
                    type="submit"
                    disabled={!chatMessage.trim() || isSendingMessage}
                    className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white rounded-full transition-all shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
