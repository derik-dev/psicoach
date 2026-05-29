'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp, CaseContext, CaseAnalysis } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import {
  Brain,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Play,
  RotateCcw,
  Copy,
  Save,
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
  HelpCircle as HelpIcon,
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
    question: 'Como articular o ganho secundário da depressão com a culpa inconsciente ligada ao sucesso (sucesso como traição à mãe)?'
  },
  {
    title: 'Caso Exemplo: Conflito de Casal (Sistêmica)',
    text: 'Paciente de 39 anos relata alto sofrimento devido a brigas constantes com o cônjuge. Diz que sente-se "invisível e sobrecarregado" na relação, enquanto o cônjuge reclama de "cobrança e controle excessivos". Descreve um padrão repetitivo: o paciente cobra atenção de forma agressiva $\rightarrow$ o parceiro se afasta e silencia $\rightarrow$ o paciente se desespera e ataca mais $\rightarrow$ o parceiro se isola completamente. Ambos trabalham em período integral e têm dois filhos pequenos. Abordagem preferida: Sistêmica.',
    approach: 'Sistêmica',
    sessions: '1-5',
    diagnosis: 'Z63.0 (Problemas de Relacionamento entre Cônjuges)',
    alreadyTried: 'Tentar conversar calmamente durante finais de semana.',
    question: 'Como romper a circularidade da dança interativa de perseguição-distanciamento?'
  }
];

export default function NovaAnalise() {
  const { user, addCase, activePlan, analysesUsed } = useApp();
  const router = useRouter();

  // Form State
  const [title, setTitle] = useState('');
  const [inputText, setInputText] = useState('');
  const [sessionsCount, setSessionsCount] = useState('1-5');
  const [currentDiagnosis, setCurrentDiagnosis] = useState('');
  const [alreadyTried, setAlreadyTried] = useState('');
  const [specificQuestion, setSpecificQuestion] = useState('');
  const [customApproach, setCustomApproach] = useState('');
  const [useCustomApproach, setUseCustomApproach] = useState(false);

  // UI state
  const [contextExpanded, setContextExpanded] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedCaseId, setAnalyzedCaseId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<CaseAnalysis | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Chat State
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
    const isSistemica = approach.toLowerCase().includes('sist') || approach.toLowerCase().includes('casal') || approach.toLowerCase().includes('fam');

    if (isTCC) {
      return {
        hypothesis: `Com base na Terapia Cognitivo-Comportamental (TCC), o caso descreve um quadro estruturado sobre pensamentos automáticos altamente catastrofizantes de desempenho e inadequação social. A tríade cognitiva está direcionada ao autoconceito de incapacidade e a suposições rígidas como: "Se eu falhar em público, perderei todo meu valor". A esquiva ativa e comportamentos de segurança sutis servem para amortecer a ansiedade no curto prazo, mas operam mantendo as crenças nucleares disfuncionais intactas e impedindo a habituação emocional.`,
        approaches: [
          'Flexibilização de pensamentos automáticos através do registro e questionamento socrático sobre as evidências de demissão/humilhação.',
          'Planejamento de Experimentos Comportamentais graduais de exposição: planeje tarefas em que o paciente cometa pequenos erros programados voluntariamente para confrontar a catastrofização.',
          'Mapeamento e retirada sistemática de Comportamentos de Segurança (ex: retirar anotações excessivas e treinar contato visual).'
        ],
        questions: [
          'Se você cometesse um erro leve em uma reunião, o que exatamente seus colegas pensariam e qual o nível real de impacto no seu emprego?',
          'Onde você aprendeu a regra inconsciente de que errar é sinônimo de total incapacidade profissional?',
          'Como podemos testar, de maneira segura na próxima semana, o abandono gradual dos seus comportamentos de proteção?'
        ],
        references: [
          'Beck, J. S. (2021). Terapia Cognitivo-Comportamental: Teoria e Prática. Artmed.',
          'Clark, D. M., & Wells, A. (1995). A cognitive model of social phobia.'
        ],
        blind_spot: 'Racionalizar demais a ansiedade com o paciente. A TCC exige mudança afetivo-emocional e comportamental in loco. Discutir lógica sem partir para experimentos comportamentais de exposição pode criar um ganho secundário de controle intelectualizado sem cura real.',
        alerts: [
          'Monitorar se a ansiedade gera ataques de pânico antecipatórios que causem evasão de compromissos críticos.',
          'Avaliar presença de fobia social generalizada ou comorbidade depressiva se o paciente começar a se isolar totalmente do convívio.'
        ]
      };
    } else if (isPsicanalise) {
      return {
        hypothesis: `O caso indica uma economia psíquica sob o jugo de um Superego severo e punitivo. A eclosão dos sintomas após uma conquista (como a promoção) ilustra a clássica dinâmica melancólica dos "arruinados pelo êxito". O sucesso evoca culpa inconsciente pois é fantasiado como um triunfo agressivo ou uma traição edípica em relação a figuras cuidadoras primárias desvalorizadoras. O ego se autopune através da inibição depressiva e autopunição para aplacar a severidade superegóica.`,
        approaches: [
          'Trabalho de Associação Livre centrado na culpa pelo sucesso e na ambivalência dos sentimentos infantis em relação aos pais.',
          'Análise da Transferência: observar se a paciente projeta a cobrança materna no próprio setting terapêutico, buscando desaprovação.',
          'Construção e Elaboração: reconstruir a história do desejo da paciente contraposto às expectativas e restrições impostas pela mãe.'
        ],
        questions: [
          'Quem você sente que está traindo ou agredindo ao ser bem-sucedida e feliz na sua própria vida?',
          'A quem se dirige a queixa "eu não mereço estar aqui"? A quem você gostaria de provar sua lealdade mantendo-se no fracasso?',
          'O que aconteceria com a imagem que você tem de sua mãe se você se permitisse ser infinitamente mais próspera que ela?'
        ],
        references: [
          'Freud, S. (1916). Alguns Tipos de Caráter Encontrados na Prática Psicanalítica (Os Arruinados pelo Êxito).',
          'Lacan, J. (1957-1958). Seminário 5: As Formações do Inconsciente.'
        ],
        blind_spot: 'Adotar uma postura reconfortante e pedagógica de reforço egóico ("você é sim capaz, você merece"). Isso tende a fortificar a resistência superegóica, pois ignora que a paciente tem uma necessidade estrutural inconsciente de punição. A culpa deve ser desvelada em sua raiz, e não consolada.',
        alerts: [
          'Risco de atuação ou autossabotagem acentuada (pedir demissão inexplicavelmente ou cometer erros graves no trabalho).',
          'Sintomas somáticos associados (estafa profunda, fibromialgia, colapso imunológico) como expressão da agressividade voltada contra si.'
        ]
      };
    } else {
      return {
        hypothesis: `Sob a ótica sistêmica, a problemática reflete uma disfuncionalidade nos padrões de comunicação e na circularidade interativa do sistema conjugal/familiar. O casal está aprisionado em um ciclo repetitivo de Perseguidor-Distanciador. As tentativas de solução de cada um (cobrar vs silenciar) atuam realimentando o problema do outro, criando uma homeostase de conflito. As demandas por intimidade e vulnerabilidade emocional foram soterradas por conflitos de poder e disputas de sobrecarga.`,
        approaches: [
          'Mapeamento Circular em sessão: ajudar os pacientes a visualizarem o ciclo em que estão presos e como a ação de um puxa a reação do outro.',
          'Prescrição de Tarefa Paradoxal: sugerir que agendem momentos curtos e específicos para debater as cobranças, proibindo-as fora do horário.',
          'Redefinição Positiva da intenção de ambos: redefinir o ataque como um grito por conexão e a esquiva como uma tentativa de autopreservar a paz.'
        ],
        questions: [
          'Quando um de vocês dá um passo atrás e se cala, o que o outro sente que precisa fazer para não ser abandonado?',
          'Como era o modelo de casamento dos pais de cada um de vocês no que tange a gerenciar conflitos e raiva?',
          'Se esse ciclo interminável sumisse hoje, o que restaria do relacionamento de vocês sobre o qual teriam que falar?'
        ],
        references: [
          'Watzlawick, P., Beavin, J. H., & Jackson, D. D. (1967). Pragmática da Comunicação Humana. Cultrix.',
          'Minuchin, S. (1974). Famílias e Casais: Técnicas de Terapia Familiar.'
        ],
        blind_spot: 'Aliar-se conscientemente ou inconscientemente a um dos cônjuges (por exemplo, validar apenas a sobrecarga de um deles). Na visão sistêmica, o cliente é a relação, e a causalidade é sempre circular. A neutralidade terapêutica é indispensável.',
        alerts: [
          'Escalada de violência verbal que possa descambar para violência física ou psicológica severa.',
          'Triangulação dos filhos (usar as crianças como mediadores, espiões ou aliados nos conflitos conjugais).'
        ]
      };
    }
  };

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText || inputText.trim().length < 10) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);

    setTimeout(() => {
      const approach = useCustomApproach ? customApproach : (user?.mainApproach || 'TCC');
      const mockResult = generateAnalysis(inputText, approach);
      
      const newCase = addCase(
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
    const text = `
PSI-COACH AI - ANÁLISE DE CASO CLÍNICO
Caso: ${title || 'Caso Clínico'}
Abordagem: ${useCustomApproach ? customApproach : user?.mainApproach}

🔍 HIPÓTESE CLÍNICA
${analysisResult.hypothesis}

🛤️ ABORDAGENS SUGERIDAS
${analysisResult.approaches.map((a, i) => `${i + 1}. ${a}`).join('\n')}

❓ PERGUNTAS PARA PRÓXIMA SESSÃO
${analysisResult.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

📚 REFERÊNCIAS TEÓRICAS
${analysisResult.references.map((r, i) => `${i + 1}. ${r}`).join('\n')}

👁️ PONTO CEGO POSSÍVEL
${analysisResult.blind_spot}

⚠️ ATENÇÃO E ALERTAS
${analysisResult.alerts.map((a, i) => `- ${a}`).join('\n')}
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
        botResponse = 'Na clínica sob transferência, recomendo observar como o paciente projeta em você as demandas de aprovação infantil. Evite ocupar o lugar do juiz (Superego). Em vez disso, aponte em ato: "Você percebe que se preocupa em falar o que acha que eu gostaria de ouvir?". Isso desloca o sujeito para a própria implicação subjetiva.';
      } else if (userText.toLowerCase().includes('resistencia') || userText.toLowerCase().includes('resistência')) {
        botResponse = 'A resistência sinaliza que nos aproximamos de um núcleo doloroso (o trauma ou a fantasia nuclear). Na TCC, valide a dor ("Compreendo que seja muito difícil falar sobre isso") antes de insistir na exposição. Reduza o nível do experimento comportamental na escala de ansiedade, garantindo que o paciente sinta que tem controle sobre o processo.';
      } else if (userText.toLowerCase().includes('famili') || userText.toLowerCase().includes('pais') || userText.toLowerCase().includes('mãe')) {
        botResponse = 'Excelente ponto. As figuras parentais estabeleceram a "matriz de apego" do paciente. Investigue as regras implícitas estabelecidas pelo clã familiar: "Para ser amado neste clã, eu preciso sofrer/ser perfeito?". A neurose do paciente é a tentativa de responder a essa demanda infantil para assegurar o amor do outro.';
      } else {
        botResponse = `Essa é uma excelente reflexão clínica. Considerando a abordagem escolhida, recomendo que na próxima sessão você foque em desacelerar o ritmo e permitir que o paciente explore essa dúvida em primeira pessoa. O segredo é não fornecer respostas imediatas, mas atuar como o espelho que reflete as próprias incongruências estruturais do discurso dele. Como você se sente conduzindo essa intervenção?`;
      }

      setChatHistory((prev) => [...prev, { role: 'assistant', text: botResponse }]);
      setIsSendingMessage(false);

      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#f5f2eb] flex items-center gap-2">
          <Brain className="w-7 h-7 text-[#b18cf2]" />
          <span className="font-serif-clinical italic">Fazer Nova Análise de Caso</span>
        </h1>
        <p className="text-[#b4aebd] text-xs mt-1">
          Forneça as anotações e nuances do paciente. A IA estruturará o caso sob um olhar científico e analítico.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* LEFT COLUMN: Input Form */}
        <div className="space-y-6 bg-[#120e19]/45 border border-[#b18cf2]/5 rounded-3xl p-6 backdrop-blur-2xl">
          {/* Sample quick selectors */}
          {(!inputText || inputText.length === 0) && (
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-[#b4aebd] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#db7b63]" />
                <span>Casos Clínicos de Teste (Modelos reais)</span>
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {SAMPLES.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSample(sample)}
                    className="p-3 text-left rounded-xl bg-[#09070c] hover:bg-[#b18cf2]/10 border border-[#b18cf2]/5 hover:border-[#b18cf2]/20 transition-all text-[11px] font-bold text-[#b4aebd] hover:text-[#b18cf2] leading-tight"
                  >
                    {sample.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleAnalyze} className="space-y-5">
            {/* Title */}
            <div className="space-y-2">
              <label htmlFor="case-title" className="text-[10px] font-bold text-[#b4aebd] uppercase tracking-widest">
                Identificação do Dossiê / Pseudônimo (Opcional)
              </label>
              <input
                id="case-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Caso G. - Fobia Social"
                className="w-full bg-[#09070c] border border-[#b18cf2]/5 focus:border-[#b18cf2] rounded-xl px-4 py-2.5 text-xs text-[#f5f2eb] placeholder-[#736c7e] outline-none transition-all"
              />
            </div>

            {/* Core Text Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="case-text" className="text-[10px] font-bold text-[#b4aebd] uppercase tracking-widest flex items-center gap-1">
                  <span>Relato Clínico ou Anotações de Sessão</span>
                  <span className="text-[#db7b63]">*</span>
                </label>
                <span className="text-[9px] text-[#736c7e] font-bold">
                  {inputText.length} caracteres ({'>'}200 recomendado)
                </span>
              </div>
              <textarea
                id="case-text"
                required
                rows={11}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Insira as queixas do paciente, verbalizações importantes na sessão, comportamento observado (hesitações, evitação do olhar), histórico familiar de relevância ou conflito central..."
                className="w-full bg-[#09070c] border border-[#b18cf2]/5 focus:border-[#b18cf2] rounded-2xl px-4 py-3.5 text-xs text-[#f5f2eb] placeholder-[#736c7e] outline-none transition-all resize-y leading-relaxed font-sans"
              />
            </div>

            {/* Context Collapsible */}
            <div className="border border-[#b18cf2]/5 rounded-2xl overflow-hidden bg-[#09070c]/50">
              <button
                type="button"
                onClick={() => setContextExpanded(!contextExpanded)}
                className="w-full px-4 py-3 bg-[#120e19]/60 hover:bg-[#181422]/60 flex items-center justify-between text-[10px] font-bold text-[#b4aebd] uppercase tracking-wider transition-colors"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#b18cf2]" />
                  <span>Configurações Adicionais do Paciente</span>
                </span>
                {contextExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {contextExpanded && (
                <div className="p-4 border-t border-[#b18cf2]/5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-[#736c7e] uppercase tracking-wider">
                        Sessões Realizadas
                      </label>
                      <select
                        value={sessionsCount}
                        onChange={(e) => setSessionsCount(e.target.value)}
                        className="w-full bg-[#09070c] border border-[#b18cf2]/5 focus:border-[#b18cf2] rounded-xl px-3 py-2 text-xs text-[#b4aebd] outline-none"
                      >
                        <option value="1-5">Fase de Acolhimento Inicial (1-5)</option>
                        <option value="5-10">Mapeamento e Aliança Terapêutica (5-10)</option>
                        <option value="10-20">Processamento Estruturado (10-20)</option>
                        <option value="20-50">Evolução e Elaboração Tardia (20-50)</option>
                        <option value="+50">Longa duração / Alta Complexidade (+50)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-[#736c7e] uppercase tracking-wider">
                        Classificação Diagnóstica
                      </label>
                      <input
                        type="text"
                        value={currentDiagnosis}
                        onChange={(e) => setCurrentDiagnosis(e.target.value)}
                        placeholder="Ex: F41.1 (TAG) ou hipótese inicial"
                        className="w-full bg-[#09070c] border border-[#b18cf2]/5 focus:border-[#b18cf2] rounded-xl px-3 py-2 text-xs text-[#f5f2eb] outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-[#736c7e] uppercase tracking-wider">
                      O que já foi trabalhado na terapia?
                    </label>
                    <input
                      type="text"
                      value={alreadyTried}
                      onChange={(e) => setAlreadyTried(e.target.value)}
                      placeholder="Ex: Psicoeducação do pânico, diário de bordo cognitivo..."
                      className="w-full bg-[#09070c] border border-[#b18cf2]/5 focus:border-[#b18cf2] rounded-xl px-3 py-2 text-xs text-[#f5f2eb] outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-[#736c7e] uppercase tracking-wider">
                      Dúvida ou Impasse Específico a Mapear
                    </label>
                    <input
                      type="text"
                      value={specificQuestion}
                      onChange={(e) => setSpecificQuestion(e.target.value)}
                      placeholder="Ex: Como lidar com o mecanismo de racionalização desse paciente?"
                      className="w-full bg-[#09070c] border border-[#b18cf2]/5 focus:border-[#b18cf2] rounded-xl px-3 py-2 text-xs text-[#f5f2eb] outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Approach select toggle */}
            <div className="p-4 rounded-2xl bg-[#09070c] border border-[#b18cf2]/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-[#f5f2eb]">Diretriz Teórica da Formulação</h4>
                  <p className="text-[9px] text-[#736c7e]">O vocabulário da análise se adaptará a essa escolha.</p>
                </div>
                <div className="flex items-center">
                  <input
                    id="override-approach"
                    type="checkbox"
                    checked={useCustomApproach}
                    onChange={(e) => setUseCustomApproach(e.target.checked)}
                    className="w-4 h-4 text-[#b18cf2] border-[#b18cf2]/10 rounded focus:ring-[#b18cf2] bg-[#09070c] cursor-pointer"
                  />
                  <label htmlFor="override-approach" className="ml-2 text-xs font-bold text-[#b18cf2] cursor-pointer">
                    Mudar Abordagem
                  </label>
                </div>
              </div>

              {!useCustomApproach ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-[#b18cf2] bg-[#b18cf2]/5 border border-[#b18cf2]/10 p-2.5 rounded-xl">
                  <CheckCircle className="w-4 h-4 text-[#7da893]" />
                  <span>Usando sua abordagem padrão: {user?.mainApproach}</span>
                </div>
              ) : (
                <select
                  value={customApproach}
                  onChange={(e) => setCustomApproach(e.target.value)}
                  className="w-full bg-[#09070c] border border-[#b18cf2]/5 focus:border-[#b18cf2] rounded-xl px-3 py-2 text-xs text-[#f5f2eb] outline-none"
                >
                  <option value="TCC (Terapia Cognitivo-Comportamental)">TCC (Terapia Cognitivo-Comportamental)</option>
                  <option value="Psicanálise">Psicanálise</option>
                  <option value="Humanista / Fenomenologia">Humanista / Fenomenologia</option>
                  <option value="Sistêmica / Terapia Familiar">Sistêmica / Terapia Familiar</option>
                  <option value="Gestalt-terapia">Gestalt-terapia</option>
                  <option value="Junguiana / Psicologia Analítica">Junguiana / Psicologia Analítica</option>
                </select>
              )}
            </div>

            {/* CTAs */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-3 border border-[#b18cf2]/10 hover:bg-[#181422] text-[#b4aebd] hover:text-[#f5f2eb] rounded-xl text-xs font-semibold transition-all duration-200"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Limpar</span>
              </button>
              
              <button
                type="submit"
                disabled={inputText.trim().length < 10 || isAnalyzing}
                className="flex-[2] inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#a274eb] to-[#db7b63] hover:opacity-95 disabled:from-[#181422] disabled:to-[#181422] disabled:opacity-40 text-[#09070c] font-extrabold rounded-xl text-xs transition-all duration-300 shadow-md shadow-[#a274eb]/10 cursor-pointer"
              >
                {isAnalyzing ? (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#09070c] border-t-transparent rounded-full animate-spin" />
                    <span>Processando caso...</span>
                  </div>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Gerar Dossiê Clínico</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: Output Analysis Results */}
        <div className="space-y-6">
          {!isAnalyzing && !analysisResult ? (
            <div className="h-[580px] rounded-3xl border border-dashed border-[#b18cf2]/15 bg-[#120e19]/10 flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="p-4.5 rounded-2xl bg-[#b18cf2]/5 border border-[#b18cf2]/15 text-[#b18cf2] animate-pulse">
                <Brain className="w-9 h-9" />
              </div>
              <div className="space-y-2 max-w-sm">
                <h3 className="text-sm font-bold text-[#f5f2eb] font-serif-clinical italic">Prontuário Vazio</h3>
                <p className="text-xs text-[#b4aebd] leading-relaxed">
                  Digite seu relato e clique em <strong>Gerar Dossiê Clínico</strong>. O copiloto formulará a hipótese teórica e indicará eixos terapêuticos.
                </p>
              </div>
            </div>
          ) : isAnalyzing ? (
            <div className="h-[580px] rounded-3xl border border-[#b18cf2]/5 bg-[#120e19]/35 flex flex-col items-center justify-center text-center p-8 space-y-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#b18cf2]/5 via-transparent to-[#db7b63]/5" />
              
              {/* Premium Flower of life/waves glow */}
              <div className="relative">
                <div className="absolute -inset-6 rounded-full bg-[#b18cf2]/15 blur-2xl animate-ping" />
                <div className="p-5.5 rounded-full bg-[#b18cf2]/10 border border-[#b18cf2]/20 text-[#b18cf2] relative z-10 animate-pulse">
                  <Brain className="w-10 h-10 text-[#b18cf2]" />
                </div>
              </div>
              
              <div className="space-y-3 relative z-10 max-w-sm">
                <span className="text-[10px] font-bold text-[#db7b63] uppercase tracking-widest animate-pulse">Santuário PsiCoach AI</span>
                <h3 className="text-base font-bold text-[#f5f2eb] font-serif-clinical italic">Tecendo formulações clínicas...</h3>
                <p className="text-[11px] text-[#b4aebd] leading-relaxed">
                  Mapeando afetos, barreiras e estruturação psíquica do caso no modelo de <span className="text-[#b18cf2] font-bold">{useCustomApproach ? customApproach : user?.mainApproach}</span>.
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-44 bg-[#09070c] rounded-full h-1 overflow-hidden border border-[#b18cf2]/5">
                <div className="h-full rounded-full bg-gradient-to-r from-[#b18cf2] to-[#db7b63] animate-loading-bar" />
              </div>
            </div>
          ) : (
            // Results Display - dossiers format!
            <div className="space-y-6 animate-premium-fade">
              <div className="p-6 rounded-3xl bg-[#120e19]/45 border border-[#b18cf2]/5 backdrop-blur-2xl space-y-6">
                {/* Header Actions */}
                <div className="flex items-center justify-between border-b border-[#b18cf2]/5 pb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4.5 h-4.5 text-[#b18cf2]" />
                    <div>
                      <span className="text-[9px] font-bold text-[#b18cf2] uppercase tracking-wider block">Clinical Dossier</span>
                      <h3 className="text-xs font-bold text-[#b4aebd] uppercase">Formulação Científica Completa</h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyText}
                      title="Copiar Texto da Análise"
                      className="p-2 rounded-xl bg-[#09070c] border border-[#b18cf2]/5 text-[#b4aebd] hover:text-[#b18cf2] hover:border-[#b18cf2]/30 transition-all flex items-center gap-1.5 text-xs font-bold"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copySuccess ? 'Copiado' : 'Copiar'}</span>
                    </button>

                    <span className="text-[10px] font-bold text-[#7da893] bg-[#7da893]/10 px-3 py-2 rounded-xl border border-[#7da893]/20 flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Dossiê Arquivado</span>
                    </span>
                  </div>
                </div>

                {/* Structured Output Panels - Journal Style */}
                <div className="space-y-6 max-h-[480px] overflow-y-auto pr-2">
                  {/* Hypothesis */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-[#736c7e] uppercase tracking-widest flex items-center gap-2">
                      <span className="p-1 rounded bg-[#b18cf2]/10 text-[#b18cf2]"><Brain className="w-3.5 h-3.5" /></span>
                      <span>Mapeamento e Hipótese Clínica</span>
                    </h4>
                    <p className="text-xs leading-relaxed text-[#f5f2eb]/90 font-serif-clinical italic p-5 bg-[#09070c]/60 border border-[#b18cf2]/5 rounded-2xl">
                      {analysisResult?.hypothesis}
                    </p>
                  </div>

                  {/* Suggested Approaches */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-[#736c7e] uppercase tracking-widest flex items-center gap-2">
                      <span className="p-1 rounded bg-[#db7b63]/10 text-[#db7b63]"><TrendingUp className="w-3.5 h-3.5" /></span>
                      <span>Intervenções & Prática Clínica</span>
                    </h4>
                    <div className="space-y-2">
                      {analysisResult?.approaches.map((app, idx) => (
                        <div key={idx} className="flex gap-3 p-4 bg-[#09070c]/40 border border-[#b18cf2]/5 rounded-2xl text-xs text-[#b4aebd]">
                          <span className="w-5 h-5 rounded-full bg-[#b18cf2]/15 border border-[#b18cf2]/20 flex items-center justify-center font-bold text-[#b18cf2] shrink-0 text-[10px] mt-0.5">
                            {idx + 1}
                          </span>
                          <p className="leading-relaxed font-sans">{app}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Socratic Questions */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-[#736c7e] uppercase tracking-widest flex items-center gap-2">
                      <span className="p-1 rounded bg-amber-500/10 text-amber-500"><HelpCircle className="w-3.5 h-3.5" /></span>
                      <span>Eixos de Questionamento Terapêutico</span>
                    </h4>
                    <div className="space-y-2">
                      {analysisResult?.questions.map((q, idx) => (
                        <div key={idx} className="p-4 bg-[#09070c]/40 border border-[#b18cf2]/5 rounded-2xl text-xs text-[#f5f2eb]/90 flex items-start gap-2.5">
                          <HelpIcon className="w-4 h-4 text-[#b18cf2] shrink-0 mt-0.5" />
                          <span className="italic font-serif-clinical leading-relaxed">"{q}"</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* References */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-[#736c7e] uppercase tracking-widest flex items-center gap-2">
                      <span className="p-1 rounded bg-[#7da893]/10 text-[#7da893]"><BookOpen className="w-3.5 h-3.5" /></span>
                      <span>Fundamentação Teórica & Literatura</span>
                    </h4>
                    <div className="space-y-1.5">
                      {analysisResult?.references.map((ref, idx) => (
                        <div key={idx} className="p-3 bg-[#09070c]/50 rounded-xl text-[10px] text-[#736c7e] leading-normal flex gap-2 border border-[#b18cf2]/5">
                          <CheckCircle className="w-3.5 h-3.5 text-[#7da893] shrink-0" />
                          <span>{ref}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Blind Spot */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-[#736c7e] uppercase tracking-widest flex items-center gap-2">
                      <span className="p-1 rounded bg-sky-500/10 text-sky-400"><Eye className="w-3.5 h-3.5" /></span>
                      <span>Evolução & Pontos Cegos de Atenção</span>
                    </h4>
                    <p className="text-xs leading-relaxed text-[#b4aebd] p-4 bg-[#09070c]/40 border border-[#b18cf2]/5 rounded-2xl border-l-2 border-l-[#db7b63]">
                      {analysisResult?.blind_spot}
                    </p>
                  </div>

                  {/* Alerts */}
                  {analysisResult?.alerts && analysisResult.alerts.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-[#db7b63] uppercase tracking-widest flex items-center gap-2">
                        <span className="p-1 rounded bg-[#db7b63]/10 text-[#db7b63]"><AlertTriangle className="w-3.5 h-3.5" /></span>
                        <span>Marcadores de Alerta Clínico</span>
                      </h4>
                      <div className="p-4 bg-[#db7b63]/5 border border-[#db7b63]/15 rounded-2xl space-y-2">
                        {analysisResult.alerts.map((al, idx) => (
                          <div key={idx} className="text-xs text-[#db7b63] leading-relaxed flex gap-2 font-medium">
                            <span className="text-[#db7b63] font-bold">•</span>
                            <span>{al}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* CHAT INTERACTIVE: Ask more clinical questions */}
              <div className="p-6 rounded-3xl bg-[#120e19]/45 border border-[#b18cf2]/5 backdrop-blur-2xl space-y-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-[#f5f2eb] flex items-center gap-2">
                    <Sparkle className="w-4 h-4 text-[#db7b63]" />
                    <span className="font-serif-clinical italic">Aprofundamento Clínico Integrado</span>
                  </h4>
                  <p className="text-[10px] text-[#736c7e]">
                    Debata a contratransferência, resistências específicas e elabore intervenções complementares.
                  </p>
                </div>

                {/* Chat History Panel */}
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {chatHistory.length === 0 ? (
                    <p className="text-xs text-[#736c7e] italic text-center py-4">
                      Exemplo: "Sugira uma técnica de aceitação voltada a essa crença" ou "Como manejar a transferência na sessão seguinte?"
                    </p>
                  ) : (
                    chatHistory.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex gap-3 p-3.5 rounded-2xl text-xs max-w-[90%] leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-[#b18cf2]/10 border border-[#b18cf2]/20 text-[#f5f2eb] ml-auto flex-row-reverse'
                            : 'bg-[#09070c] border border-[#b18cf2]/5 text-[#b4aebd] mr-auto'
                        }`}
                      >
                        <div className={`p-1.5 rounded-xl shrink-0 h-7 w-7 flex items-center justify-center ${
                          msg.role === 'user' ? 'bg-[#b18cf2] text-[#09070c] font-bold' : 'bg-[#120e19] text-[#b18cf2] border border-[#b18cf2]/10'
                        }`}>
                          {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-[#736c7e] uppercase">
                            {msg.role === 'user' ? 'Você (Psicóloga)' : 'PsiCoach Copiloto'}
                          </span>
                          <p className="whitespace-pre-line font-sans">{msg.text}</p>
                        </div>
                      </div>
                    ))
                  )}

                  {isSendingMessage && (
                    <div className="flex gap-3 p-3.5 rounded-2xl text-xs bg-[#09070c] border border-[#b18cf2]/5 text-[#736c7e] mr-auto max-w-[90%]">
                      <div className="p-1.5 rounded-xl bg-[#120e19] text-[#b18cf2] border border-[#b18cf2]/10 shrink-0 h-7 w-7 flex items-center justify-center animate-pulse">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="flex items-center gap-1.5 py-1">
                        <span className="w-2 h-2 bg-[#b18cf2] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-[#b18cf2] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-[#b18cf2] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Input form chat */}
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Refine a intervenção ou aprofunde a teoria do caso..."
                    className="flex-1 bg-[#09070c] border border-[#b18cf2]/5 focus:border-[#b18cf2] rounded-xl px-4 py-2.5 text-xs text-[#f5f2eb] outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!chatMessage.trim() || isSendingMessage}
                    className="p-2.5 bg-gradient-to-r from-[#a274eb] to-[#db7b63] disabled:opacity-40 text-[#09070c] rounded-xl transition-all flex items-center justify-center shrink-0 cursor-pointer"
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
