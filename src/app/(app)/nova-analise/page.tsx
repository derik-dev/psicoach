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
  AlertTriangle,
  HelpCircle,
  BookOpen,
  Eye,
  FileText,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';

export default function NovaAnalise() {
  const { user } = useApp();
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
  const [analysisResult, setAnalysisResult] = useState<CaseAnalysis | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && !useCustomApproach) {
      setCustomApproach(user.mainApproach);
    }
  }, [user, useCustomApproach]);

  const handleReset = () => {
    setTitle('');
    setInputText('');
    setSessionsCount('1-5');
    setCurrentDiagnosis('');
    setAlreadyTried('');
    setSpecificQuestion('');
    setUseCustomApproach(false);
    setCustomApproach(user?.mainApproach || '');
    setAnalysisResult(null);
    setErrorMessage(null);
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText || inputText.trim().length < 10) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setErrorMessage(null);

    const approach = useCustomApproach ? customApproach : (user?.mainApproach || '');

    try {
      // TODO: integrar com a IA real (Claude) por trás de /api/analyze.
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          input_text: inputText,
          approach,
          context: {
            sessions_count: sessionsCount,
            current_diagnosis: currentDiagnosis,
            already_tried: alreadyTried,
            specific_question: specificQuestion,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data?.error || 'Não foi possível gerar a análise no momento.');
      } else if (data?.analysis) {
        setAnalysisResult(data.analysis as CaseAnalysis);
      } else {
        setErrorMessage('Resposta inesperada do servidor de IA.');
      }
    } catch {
      setErrorMessage('Falha de comunicação com o servidor de IA.');
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    }
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

  // Avoid TS unused warning
  void router;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="page-headline">
            Nova <span className="page-headline-accent">análise.</span>
          </h1>
          <p className="text-slate-500 text-sm max-w-xl">
            Forneça as anotações do paciente. A IA estruturará o caso sob um olhar científico.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* LEFT: Input form */}
        <div className="space-y-5 bg-white border border-slate-100 rounded-3xl shadow-sm p-6 lg:p-7">
          <form onSubmit={handleAnalyze} className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Pseudônimo (opcional)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Caso G. - Fobia Social"
                className="w-full bg-white border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
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
                rows={6}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Insira queixas do paciente, verbalizações importantes, comportamento observado, histórico relevante..."
                className="w-full bg-white border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all resize-y leading-relaxed"
              />
            </div>

            {/* Context collapsible */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/40">
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

            <div className="p-3 rounded-xl bg-slate-50/60 border border-slate-100 space-y-2">
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
                  <span>Padrão: {user?.mainApproach || 'Não definida'}</span>
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

            <div className="flex items-center gap-3">
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
          {errorMessage ? (
            <div className="h-[580px] rounded-3xl border border-rose-200 bg-rose-50/40 flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div className="space-y-2 max-w-sm">
                <h3 className="text-base font-semibold text-rose-700">Análise indisponível</h3>
                <p className="text-[13px] text-rose-600 leading-relaxed">{errorMessage}</p>
                <p className="text-[11px] text-slate-500">
                  Tente novamente em instantes. A integração com a IA está sendo finalizada.
                </p>
              </div>
            </div>
          ) : !isAnalyzing && !analysisResult ? (
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
          ) : analysisResult ? (
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
                  </div>
                </div>

                <div className="space-y-6 max-h-[480px] overflow-y-auto pr-1">
                  <section className="space-y-2">
                    <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <span className="p-1 rounded bg-blue-50 text-blue-600"><Brain className="w-3.5 h-3.5" /></span>
                      <span>Hipótese Clínica</span>
                    </h4>
                    <p className="text-[13px] leading-relaxed text-slate-700 p-4 bg-slate-50 border border-slate-100 rounded-2xl italic" style={{ fontFamily: 'Georgia, serif' }}>
                      {analysisResult.hypothesis}
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <span className="p-1 rounded bg-emerald-50 text-emerald-600"><TrendingUp className="w-3.5 h-3.5" /></span>
                      <span>Intervenções</span>
                    </h4>
                    <div className="space-y-2">
                      {analysisResult.approaches.map((app, idx) => (
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
                      {analysisResult.questions.map((q, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] text-slate-700 italic" style={{ fontFamily: 'Georgia, serif' }}>
                          &ldquo;{q}&rdquo;
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
                      {analysisResult.references.map((ref, idx) => (
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
                      {analysisResult.blind_spot}
                    </p>
                  </section>

                  {analysisResult.alerts && analysisResult.alerts.length > 0 && (
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
              <div ref={bottomRef} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
