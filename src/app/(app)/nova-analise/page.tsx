'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp, CaseAnalysis } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import {
  Brain, Sparkles, ChevronDown, ChevronUp, Play, RotateCcw, Copy,
  AlertTriangle, HelpCircle, BookOpen, Eye, FileText, TrendingUp,
  CheckCircle, MessageSquare, LayoutTemplate, Send, User, Bot, Plus,
  Target, ChevronRight, X, Shield, Zap,
} from 'lucide-react';

/* ─────────────────────────── types ─────────────────────────── */

type Mode = 'standard' | 'chat';
type AtencaoNivel = 'baixo' | 'moderado' | 'alto';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  analysis?: CaseAnalysis;
  isLoading?: boolean;
}

/* ─────────────────────────── helpers ─────────────────────────── */

function deriveAtencao(result: CaseAnalysis): AtencaoNivel {
  if (result.nivel_atencao) return result.nivel_atencao;
  const txt = (result.alerts || []).join(' ').toLowerCase();
  if (
    txt.includes('suicíd') || txt.includes('homicíd') ||
    txt.includes('risco de vida') || txt.includes('autolesão') ||
    txt.includes('auto-lesão')
  ) return 'alto';
  if ((result.alerts || []).length > 0) return 'moderado';
  return 'baixo';
}

function createEmptyAnalysis(): CaseAnalysis {
  return {
    hypothesis: '',
    approaches: [],
    questions: [],
    references: [],
    blind_spot: '',
    alerts: [],
  };
}

const ATENCAO_CFG: Record<AtencaoNivel, {
  label: string; sublabel: string;
  color: string; bg: string; border: string; dot: string;
}> = {
  baixo: {
    label: 'Baixa atenção',
    sublabel: 'Sem indícios de urgência',
    color: 'text-emerald-700', bg: 'bg-emerald-50',
    border: 'border-emerald-200', dot: 'bg-emerald-500',
  },
  moderado: {
    label: 'Atenção moderada',
    sublabel: 'Pontos que merecem investigação',
    color: 'text-amber-700', bg: 'bg-amber-50',
    border: 'border-amber-200', dot: 'bg-amber-500',
  },
  alto: {
    label: 'Atenção clínica alta',
    sublabel: 'Recomenda-se avaliação cuidadosa',
    color: 'text-rose-700', bg: 'bg-rose-50',
    border: 'border-rose-200', dot: 'bg-rose-500',
  },
};

/* ══════════════════════ AnalysisCard ══════════════════════ */

type TabId = 'sintese' | 'formulacao' | 'risco' | 'intervencoes' | 'prontuario' | 'referencias';

function AnalysisCard({
  result, onCopy, copySuccess,
}: {
  result: CaseAnalysis;
  onCopy: () => void;
  copySuccess: boolean;
}) {
  const [activeTab, setActiveTab] = useState<TabId>('sintese');
  const [modalOpen, setModalOpen] = useState(false);

  const nivel = deriveAtencao(result);
  const cfg = ATENCAO_CFG[nivel];

  /* map existing fields → new display structure */
  const resumo       = result.resumo_rapido   || (result.hypothesis.split('.')[0] + '.');
  const focoInicial  = result.foco_inicial    || result.approaches[0] || '—';
  const proxPergunta = result.proxima_pergunta || result.questions[0] || '—';
  const hipotese     = result.hipotese_central || result.hypothesis;
  const fatores      = result.fatores_relevantes || result.approaches.slice(0, 5);
  const plano        = result.plano_imediato   || result.approaches.slice(0, 3);
  const perguntas    = result.perguntas_clinicas || result.questions.slice(0, 3);

  const tabs: { id: TabId; label: string; content: string }[] = [
    { id: 'sintese',      label: 'Síntese',          content: result.sintese        || result.blind_spot },
    { id: 'formulacao',   label: 'Formulação',        content: result.formulacao     || result.hypothesis },
    { id: 'risco',        label: 'Risco e proteção',  content: result.risco_e_protecao || (result.alerts || []).join('\n') || 'Sem alertas identificados.' },
    { id: 'intervencoes', label: 'Intervenções',      content: result.intervencoes   || result.approaches.join('\n') },
    { id: 'prontuario',   label: 'Prontuário',        content: result.prontuario     || '' },
    { id: 'referencias',  label: 'Referências',       content: result.referencias_texto || result.references.join('\n') },
  ];

  const activeContent = tabs.find(t => t.id === activeTab)?.content || '';

  return (
    <div className="space-y-3">
      {/* Card header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)]">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="block text-[9px] font-semibold uppercase tracking-widest text-blue-600">Mapa clínico</span>
            <h3 className="text-[13px] font-semibold text-slate-800 leading-none mt-0.5">Formulação compacta</h3>
          </div>
        </div>
        <button
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          <Copy className="w-3 h-3" />
          {copySuccess ? 'Copiado!' : 'Copiar'}
        </button>
      </div>

      {/* ── NÍVEL 1 — 4 mini cards em linha ── */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-3">
          <span className="text-[9px] font-semibold uppercase tracking-widest text-blue-600">Resumo rápido</span>
          <p className="mt-1.5 text-[11px] leading-snug text-blue-950 line-clamp-2">{resumo}</p>
        </div>

        <div className={`rounded-2xl border p-3 ${cfg.bg} ${cfg.border}`}>
          <span className={`text-[9px] font-semibold uppercase tracking-widest ${cfg.color}`}>Atenção clínica</span>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
            <p className={`text-[11px] font-semibold leading-none ${cfg.color}`}>{cfg.label}</p>
          </div>
          <p className={`mt-1 text-[9px] leading-snug ${cfg.color} opacity-75`}>{cfg.sublabel}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">Foco inicial</span>
          <p className="mt-1.5 text-[11px] leading-snug text-slate-700 line-clamp-2">{focoInicial}</p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-3">
          <span className="text-[9px] font-semibold uppercase tracking-widest text-amber-600">Próxima pergunta</span>
          <p className="mt-1.5 text-[11px] italic leading-snug text-slate-700 line-clamp-2" style={{ fontFamily: 'Georgia, serif' }}>
            &ldquo;{proxPergunta}&rdquo;
          </p>
        </div>
      </div>

      {/* ── NÍVEL 2 — grid 2×2 ── */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
          <h4 className="mb-2 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-widest text-slate-500">
            <Brain className="h-3 w-3 text-blue-600" />
            Hipótese central
          </h4>
          <p className="text-[11px] italic leading-relaxed text-slate-700 line-clamp-4" style={{ fontFamily: 'Georgia, serif' }}>
            {hipotese}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
          <h4 className="mb-2 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-widest text-slate-500">
            <Target className="h-3 w-3 text-purple-600" />
            Fatores relevantes
          </h4>
          <ul className="space-y-1">
            {fatores.slice(0, 5).map((f, i) => (
              <li key={i} className="flex gap-1.5 text-[11px] text-slate-600 leading-snug">
                <span className="mt-1 h-1 w-1 rounded-full bg-blue-400 shrink-0" />
                <span className="line-clamp-1">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
          <h4 className="mb-2 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-widest text-slate-500">
            <TrendingUp className="h-3 w-3 text-emerald-600" />
            Plano imediato
          </h4>
          <ol className="space-y-1.5">
            {plano.slice(0, 3).map((p, i) => (
              <li key={i} className="flex gap-2 text-[11px] text-slate-600 leading-snug">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white">
                  {i + 1}
                </span>
                <span className="line-clamp-2">{p}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
          <h4 className="mb-2 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-widest text-slate-500">
            <HelpCircle className="h-3 w-3 text-amber-600" />
            Perguntas clínicas
          </h4>
          <ul className="space-y-1.5">
            {perguntas.slice(0, 3).map((q, i) => (
              <li key={i} className="text-[11px] italic leading-snug text-slate-600 line-clamp-2" style={{ fontFamily: 'Georgia, serif' }}>
                &ldquo;{q}&rdquo;
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── NÍVEL 3 — Abas compactas ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 border-b-2 px-3 py-2 text-[10px] font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 bg-white text-blue-600'
                  : 'border-transparent text-slate-500 hover:bg-white/60 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="min-h-[72px] bg-white p-3.5">
          {activeContent ? (
            <div>
              <p className="line-clamp-3 text-[12px] leading-relaxed text-slate-600">
                {activeContent}
              </p>
              {activeContent.length > 180 && (
                <button
                  onClick={() => setModalOpen(true)}
                  className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Ver análise completa <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : (
            <p className="text-[12px] italic text-slate-400">Não disponível para este caso.</p>
          )}
        </div>
      </div>

      {/* ── Botões de ação rápida ── */}
      <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
        <button
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          <Copy className="w-3 h-3" /> Copiar síntese
        </button>
        <button
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          <Zap className="w-3 h-3" /> Gerar evolução
        </button>
        <button
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          <HelpCircle className="w-3 h-3" /> Gerar perguntas
        </button>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          <Eye className="w-3 h-3" /> Ver análise completa
        </button>
      </div>

      {/* ── Modal análise completa ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-backdrop-in">
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl bg-white shadow-2xl animate-modal-in">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
              <h3 className="text-sm font-semibold text-slate-800">
                {tabs.find(t => t.id === activeTab)?.label || 'Análise completa'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-[13px] leading-relaxed text-slate-700 whitespace-pre-line">
                {activeContent}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════ main page ════════════════════ */

export default function NovaAnalise() {
  const { user, addCase, updateCase, addChatMessage } = useApp();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>('standard');

  /* shared config */
  const [sessionsCount, setSessionsCount]   = useState('1-5');
  const [currentDiagnosis, setCurrentDiagnosis] = useState('');
  const [alreadyTried, setAlreadyTried]     = useState('');
  const [specificQuestion, setSpecificQuestion] = useState('');
  const [customApproach, setCustomApproach] = useState('');
  const [useCustomApproach, setUseCustomApproach] = useState(false);
  const [contextExpanded, setContextExpanded] = useState(false);

  /* standard mode */
  const [title, setTitle]                   = useState('');
  const [inputText, setInputText]           = useState('');
  const [isAnalyzing, setIsAnalyzing]       = useState(false);
  const [analysisResult, setAnalysisResult] = useState<CaseAnalysis | null>(null);
  const [errorMessage, setErrorMessage]     = useState<string | null>(null);
  const [copySuccess, setCopySuccess]       = useState(false);

  /* chat mode */
  const [chatMessages, setChatMessages]   = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput]         = useState('');
  const [isChatSending, setIsChatSending] = useState(false);
  const [chatCopyId, setChatCopyId]       = useState<string | null>(null);
  const [currentChatCaseId, setCurrentChatCaseId] = useState<string | null>(null);

  const bottomRef      = useRef<HTMLDivElement>(null);
  const chatBottomRef  = useRef<HTMLDivElement>(null);
  const chatInputRef   = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (user && !useCustomApproach) setCustomApproach(user.mainApproach);
  }, [user, useCustomApproach]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  /* ── standard handlers ── */

  const handleReset = () => {
    setTitle(''); setInputText(''); setSessionsCount('1-5');
    setCurrentDiagnosis(''); setAlreadyTried(''); setSpecificQuestion('');
    setUseCustomApproach(false);
    setCustomApproach(user?.mainApproach || '');
    setAnalysisResult(null); setErrorMessage(null);
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText || inputText.trim().length < 10) return;
    setIsAnalyzing(true); setAnalysisResult(null); setErrorMessage(null);

    const approach = useCustomApproach ? customApproach : user?.mainApproach || '';
    const clinicalContext = {
      sessions_count: sessionsCount,
      current_diagnosis: currentDiagnosis,
      already_tried: alreadyTried,
      specific_question: specificQuestion,
    };

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, input_text: inputText, approach,
          context: clinicalContext,
        }),
      });
      const data = await res.json();
      if (!res.ok)          setErrorMessage(data?.error || 'Não foi possível gerar a análise no momento.');
      else if (data?.analysis) {
        const analysis = data.analysis as CaseAnalysis;
        await addCase(title, inputText, approach, clinicalContext, analysis);
        setAnalysisResult(analysis);
      }
      else                  setErrorMessage('Resposta inesperada do servidor de IA.');
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Falha de comunicação ou salvamento com o servidor.'
      );
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
    }
  };

  const buildCopyText = (result: CaseAnalysis) =>
    `PsiCoach AI — Análise\nAbordagem: ${useCustomApproach ? customApproach : user?.mainApproach}\n\nHIPÓTESE\n${result.hypothesis}\n\nABORDAGENS\n${result.approaches.map((a, i) => `${i + 1}. ${a}`).join('\n')}\n\nPERGUNTAS\n${result.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\nREFERÊNCIAS\n${result.references.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\nPONTO CEGO\n${result.blind_spot}\n\nALERTAS\n${result.alerts.map(a => `- ${a}`).join('\n')}`;

  const handleCopyText = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(buildCopyText(analysisResult));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  /* ── chat handlers ── */

  const handleChatReset = () => {
    setChatMessages([]);
    setChatInput('');
    setCurrentChatCaseId(null);
  };

  const handleChatSend = async () => {
    const text = chatInput.trim();
    if (!text || isChatSending) return;

    const userMsg: ChatMessage   = { id: crypto.randomUUID(), role: 'user', text };
    const loadingMsg: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', text: '', isLoading: true };
    setChatMessages(prev => [...prev, userMsg, loadingMsg]);
    setChatInput(''); setIsChatSending(true);

    const approach = useCustomApproach ? customApproach : user?.mainApproach || '';
    const clinicalContext = {
      sessions_count: sessionsCount,
      current_diagnosis: currentDiagnosis,
      already_tried: alreadyTried,
      specific_question: specificQuestion,
    };

    try {
      let persistedCaseId = currentChatCaseId;

      if (!persistedCaseId) {
        const savedCase = await addCase(
          `Conversa clínica ${new Date().toLocaleDateString('pt-BR')}`,
          text,
          approach,
          clinicalContext,
          createEmptyAnalysis(),
          { incrementUsage: false }
        );
        persistedCaseId = savedCase.id;
        setCurrentChatCaseId(savedCase.id);
      }

      await addChatMessage(persistedCaseId, 'user', text);

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text, approach,
          context: clinicalContext,
          history: chatMessages.map(m => ({ role: m.role, content: m.text })),
        }),
      });
      const data = await res.json();

      if (res.ok && data?.analysis) {
        const analysis = data.analysis as CaseAnalysis;
        await updateCase(persistedCaseId, {
          input_text: text,
          approach_used: approach,
          context: clinicalContext,
          analysis,
        });
        await addChatMessage(
          persistedCaseId,
          'assistant',
          `Aqui está a formulação clínica com base no que você compartilhou:\n\n${buildCopyText(analysis)}`
        );
      } else if (res.ok && data?.reply) {
        await addChatMessage(persistedCaseId, 'assistant', data.reply);
      }

      setChatMessages(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(m => m.id === loadingMsg.id);
        if (idx === -1) return prev;
        if (!res.ok)
          updated[idx] = { ...loadingMsg, isLoading: false, text: data?.error || 'Não foi possível gerar a análise no momento.' };
        else if (data?.analysis)
          updated[idx] = { ...loadingMsg, isLoading: false, text: 'Aqui está a formulação clínica com base no que você compartilhou:', analysis: data.analysis as CaseAnalysis };
        else
          updated[idx] = { ...loadingMsg, isLoading: false, text: data?.reply || 'Resposta inesperada do servidor de IA.' };
        return updated;
      });
    } catch (err) {
      setChatMessages(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(m => m.id === loadingMsg.id);
        if (idx !== -1) {
          updated[idx] = {
            ...loadingMsg,
            isLoading: false,
            text: err instanceof Error
              ? err.message
              : 'Falha de comunicação ou salvamento com o servidor.',
          };
        }
        return updated;
      });
    } finally {
      setIsChatSending(false);
    }
  };

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend(); }
  };

  const handleChatCopy = (msgId: string, result: CaseAnalysis) => {
    navigator.clipboard.writeText(buildCopyText(result));
    setChatCopyId(msgId);
    setTimeout(() => setChatCopyId(null), 2000);
  };

  void router;

  /* ── shared sub-panels ── */

  const ContextPanel = () => (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/40">
      <button
        type="button"
        onClick={() => setContextExpanded(!contextExpanded)}
        className="flex w-full items-center justify-between bg-white px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-slate-600 transition-colors hover:bg-slate-50"
      >
        <span className="flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-blue-600" />
          Configurações adicionais
        </span>
        {contextExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      {contextExpanded && (
        <div className="space-y-3 border-t border-slate-100 bg-white p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Sessões</label>
              <select
                value={sessionsCount}
                onChange={e => setSessionsCount(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-400"
              >
                <option value="1-5">Acolhimento (1-5)</option>
                <option value="5-10">Aliança (5-10)</option>
                <option value="10-20">Processamento (10-20)</option>
                <option value="20-50">Elaboração (20-50)</option>
                <option value="+50">Longa duração (+50)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Diagnóstico</label>
              <input
                type="text"
                value={currentDiagnosis}
                onChange={e => setCurrentDiagnosis(e.target.value)}
                placeholder="Ex: F41.1"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-400"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Já foi trabalhado</label>
            <input
              type="text"
              value={alreadyTried}
              onChange={e => setAlreadyTried(e.target.value)}
              placeholder="Ex: Psicoeducação do pânico..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-400"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Dúvida específica</label>
            <input
              type="text"
              value={specificQuestion}
              onChange={e => setSpecificQuestion(e.target.value)}
              placeholder="Ex: Como lidar com a racionalização?"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-400"
            />
          </div>
        </div>
      )}
    </div>
  );

  const ApproachPanel = () => (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-[13px] font-semibold text-slate-800">Diretriz teórica</h4>
          <p className="text-[10px] text-slate-400">O vocabulário se adapta à escolha.</p>
        </div>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={useCustomApproach}
            onChange={e => setUseCustomApproach(e.target.checked)}
            className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-xs font-semibold text-blue-600">Mudar</span>
        </label>
      </div>
      <div className="mt-2">
        {!useCustomApproach ? (
          <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 p-2.5 text-xs font-medium text-blue-700">
            <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Padrão: {user?.mainApproach || 'Não definida'}</span>
          </div>
        ) : (
          <select
            value={customApproach}
            onChange={e => setCustomApproach(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-blue-400"
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
    </div>
  );

  /* ══════════════════════════ render ══════════════════════════ */
  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-headline">
            Nova <span className="page-headline-accent">análise.</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Forneça as anotações do paciente. A IA estruturará o caso sob um olhar científico.
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex shrink-0 items-center gap-1 self-start rounded-2xl border border-slate-200 bg-slate-100 p-1 sm:self-auto">
          <button
            onClick={() => setMode('standard')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${
              mode === 'standard'
                ? 'border border-slate-200 bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LayoutTemplate className="h-4 w-4" /> Padrão
          </button>
          <button
            onClick={() => setMode('chat')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${
              mode === 'chat'
                ? 'border border-slate-200 bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <MessageSquare className="h-4 w-4" /> Chat
          </button>
        </div>
      </div>

      {/* ══════════════ STANDARD MODE ══════════════ */}
      {mode === 'standard' && (
        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[2fr_3fr]">

          {/* ── Coluna esquerda — Entrada do caso ── */}
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm lg:p-6">
            {/* Section header */}
            <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <FileText className="h-3.5 w-3.5" />
              </div>
              <h2 className="text-[13px] font-semibold text-slate-800">Entrada do caso</h2>
            </div>

            <form onSubmit={handleAnalyze} className="space-y-3">
              {/* Pseudônimo */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  Pseudônimo (opcional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Caso G. — Fobia Social"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Relato clínico */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                    Relato clínico <span className="text-rose-500">*</span>
                  </label>
                  <span className={`text-[10px] font-medium ${inputText.length >= 200 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {inputText.length} car.
                  </span>
                </div>
                <textarea
                  required
                  rows={6}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Insira queixas do paciente, verbalizações importantes, comportamento observado, histórico relevante..."
                  className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                {inputText.length > 0 && inputText.length < 200 && (
                  <p className="text-[10px] text-amber-600">Recomendado mínimo de 200 caracteres para análise mais precisa.</p>
                )}
              </div>

              <ContextPanel />
              <ApproachPanel />

              {/* Aviso anonimização */}
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                <Shield className="h-3 w-3 shrink-0 text-slate-400" />
                <p className="text-[10px] text-slate-500">Use apenas dados anonimizados.</p>
              </div>

              {/* Botões */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50"
                >
                  <RotateCcw className="h-4 w-4" /> Limpar
                </button>
                <button
                  type="submit"
                  disabled={inputText.trim().length < 10 || isAnalyzing}
                  className="inline-flex flex-[2] items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(37,99,235,0.28)] transition-all hover:-translate-y-0.5 hover:bg-blue-500 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                >
                  {isAnalyzing ? (
                    <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Processando...</>
                  ) : (
                    <><Play className="h-4 w-4 fill-current" /> Gerar análise</>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* ── Coluna direita — Resultado ── */}
          <div className="xl:sticky xl:top-6">
            {errorMessage ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-rose-200 bg-rose-50/40 p-8 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                  <AlertTriangle className="h-7 w-7" />
                </div>
                <h3 className="text-base font-semibold text-rose-700">Análise indisponível</h3>
                <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-rose-600">{errorMessage}</p>
                <p className="mt-2 text-[11px] text-slate-500">Tente novamente em instantes.</p>
              </div>

            ) : !isAnalyzing && !analysisResult ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_12px_28px_rgba(37,99,235,0.28)]">
                  <Brain className="h-7 w-7" />
                </div>
                <h3 className="text-base font-semibold text-slate-800">Dossiê vazio</h3>
                <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-slate-500">
                  Digite o relato e clique em <strong className="text-slate-700">Gerar análise</strong>. O copiloto formulará a hipótese e indicará eixos terapêuticos.
                </p>
              </div>

            ) : isAnalyzing ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm">
                <div className="relative mb-5">
                  <div className="absolute -inset-4 animate-ping rounded-full bg-blue-100 blur-2xl" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white">
                    <Brain className="h-8 w-8 animate-pulse" />
                  </div>
                </div>
                <span className="section-badge">Processando</span>
                <h3 className="mt-3 text-base font-semibold text-slate-800">Tecendo formulações clínicas...</h3>
                <p className="mt-1 max-w-sm text-[12px] leading-relaxed text-slate-500">
                  Mapeando afetos no modelo de{' '}
                  <span className="font-semibold text-blue-600">
                    {useCustomApproach ? customApproach : user?.mainApproach}
                  </span>.
                </p>
                <div className="mt-5 h-1 w-40 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-[70%] animate-pulse rounded-full bg-blue-600" />
                </div>
              </div>

            ) : analysisResult ? (
              <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm lg:p-6">
                <AnalysisCard
                  result={analysisResult}
                  onCopy={handleCopyText}
                  copySuccess={copySuccess}
                />
                <div ref={bottomRef} />
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ══════════════ CHAT MODE ══════════════ */}
      {mode === 'chat' && (
        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[320px_1fr]">

          {/* Left: config panel */}
          <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Brain className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Copiloto clínico</p>
                <p className="text-[12px] font-semibold text-slate-800">Modo conversação</p>
              </div>
            </div>
            <ContextPanel />
            <ApproachPanel />
            <button
              onClick={handleChatReset}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" /> Nova conversa
            </button>
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-600">Dica</p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-blue-700">
                Descreva o caso livremente. Você pode fazer perguntas, pedir novas intervenções ou aprofundar hipóteses.
              </p>
              <p className="mt-1.5 text-[10px] text-blue-500">Enter para enviar · Shift+Enter para nova linha</p>
            </div>
          </div>

          {/* Right: chat window */}
          <div
            className="flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm"
            style={{ height: 'calc(100vh - 220px)', minHeight: '520px' }}
          >
            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {chatMessages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_12px_28px_rgba(37,99,235,0.28)]">
                    <MessageSquare className="h-7 w-7" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-800">Inicie a conversa</h3>
                  <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-slate-500">
                    Descreva o caso como se estivesse conversando com um supervisor. A IA responderá com formulação clínica completa.
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {['Paciente com queixas de ansiedade intensa...', 'Preciso de ajuda com um caso de fobia...', 'Tenho um caso de luto complicado...'].map(s => (
                      <button
                        key={s}
                        onClick={() => { setChatInput(s); chatInputRef.current?.focus(); }}
                        className="rounded-xl border border-slate-200 px-3.5 py-2 text-[12px] font-medium text-slate-600 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                chatMessages.map(msg => (
                  <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.28)]'}`}>
                      {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div className={`max-w-[80%] space-y-3 ${msg.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                      {msg.isLoading ? (
                        <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-slate-100 bg-white px-4 py-3 shadow-sm">
                          <div className="flex gap-1">
                            {[0, 150, 300].map(d => <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-blue-400" style={{ animationDelay: `${d}ms` }} />)}
                          </div>
                          <span className="text-[12px] text-slate-400">Tecendo formulação...</span>
                        </div>
                      ) : msg.role === 'user' ? (
                        <div className="rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-3 text-[13px] leading-relaxed text-white">
                          {msg.text}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {msg.text && (
                            <div className="rounded-2xl rounded-tl-sm border border-slate-100 bg-white px-4 py-3 text-[13px] leading-relaxed text-slate-700 shadow-sm">
                              {msg.text}
                            </div>
                          )}
                          {msg.analysis && (
                            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                              <AnalysisCard
                                result={msg.analysis}
                                onCopy={() => handleChatCopy(msg.id, msg.analysis!)}
                                copySuccess={chatCopyId === msg.id}
                              />
                            </div>
                          )}
                          {!msg.analysis && msg.text && (msg.text.includes('IA') || msg.text.includes('servidor')) && (
                            <div className="flex items-start gap-2 rounded-2xl rounded-tl-sm border border-rose-100 bg-rose-50 px-4 py-3 text-[12px] text-rose-700">
                              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                              {msg.text}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat input */}
            <div className="border-t border-slate-100 p-4">
              <div className="flex items-end gap-3">
                <textarea
                  ref={chatInputRef}
                  rows={2}
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={handleChatKeyDown}
                  placeholder="Descreva o caso ou faça uma pergunta ao copiloto..."
                  className="flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  onClick={handleChatSend}
                  disabled={!chatInput.trim() || isChatSending}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.28)] transition-all hover:-translate-y-0.5 hover:bg-blue-500 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:shadow-none"
                >
                  {isChatSending ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
