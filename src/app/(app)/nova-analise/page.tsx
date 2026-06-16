'use client';

import React, { Suspense, useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useApp, CaseAnalysis, Patient, planCanAccess } from '@/context/AppContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import {
  Brain, Sparkles, ChevronDown, Play, RotateCcw, Copy,
  AlertTriangle, HelpCircle, BookOpen, Eye, FileText, TrendingUp,
  CheckCircle, LayoutTemplate, Plus,
  Target, ChevronRight, X, Shield, Zap, Check, Mic, Square, Upload, Lock,
  Users, UserPlus, Clock, Save, MessageSquare,
} from 'lucide-react';
import Link from 'next/link';

/* ─────────────────────────── types ─────────────────────────── */

type Mode = 'standard' | 'audio';
type AtencaoNivel = 'baixo' | 'moderado' | 'alto';

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
  label: string; bullets: string[];
  color: string; bg: string; border: string; badge: string;
}> = {
  baixo: {
    label: 'Baixa atenção',
    bullets: ['Sem sinais de risco imediato', 'Progresso dentro do esperado', 'Vínculo estável'],
    color: 'text-emerald-700', bg: 'bg-emerald-50',
    border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700',
  },
  moderado: {
    label: 'Atenção moderada',
    bullets: ['Pontos que merecem investigação', 'Monitorar evolução de perto', 'Avaliar fatores de risco'],
    color: 'text-amber-700', bg: 'bg-amber-50',
    border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700',
  },
  alto: {
    label: 'Atenção clínica alta',
    bullets: ['Sinais de risco identificados', 'Protocolo de segurança indicado', 'Avaliação prioritária'],
    color: 'text-rose-700', bg: 'bg-rose-50',
    border: 'border-rose-200', badge: 'bg-rose-100 text-rose-700',
  },
};

/* ══════════════════════ Markdown helpers ══════════════════════ */

function renderMd(text: string) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => (
          <p className="text-slate-700" style={{ lineHeight: 1.8, marginBottom: '0.75rem' }}>{children}</p>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-slate-800">{children}</strong>
        ),
        li: ({ children }) => (
          <li className="text-slate-700" style={{ lineHeight: 1.8 }}>{children}</li>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

/* ══════════════════════ FormattedText ══════════════════════ */

function FormattedText({ text }: { text: string }) {
  const paragraphs = text.split(/\n{1,2}/).filter(p => p.trim());

  return (
    <div className="space-y-0 text-slate-700" style={{ lineHeight: 1.8 }}>
      {paragraphs.map((para, i) => (
        <div key={i} style={{ lineHeight: 1.8 }}>
          {renderMd(para)}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════ AnalysisCard ══════════════════════ */

type TabId = 'sintese' | 'formulacao' | 'risco' | 'intervencoes' | 'prontuario' | 'referencias';

/* ── helper: extrai ciclo clínico de texto com → ou -> ── */
function extractClinicalCycle(text: string): string[] | null {
  const arrowPattern = /([^→\->]{3,50})\s*(?:→|->)\s*/g;
  const parts: string[] = [];
  let match;
  const combined = text.replace(/->/g, '→');
  // tenta linha com sequência de setas
  const lines = combined.split('\n');
  for (const line of lines) {
    if ((line.match(/→/g) || []).length >= 2) {
      const segments = line.split('→').map(s => s.trim()).filter(s => s.length > 1 && s.length < 50);
      if (segments.length >= 3) return segments;
    }
  }
  // tenta no texto todo
  const fullMatch = combined.match(/([^→]{2,40}→){2,}[^→]{2,40}/);
  if (fullMatch) {
    const segments = fullMatch[0].split('→').map(s => s.trim()).filter(s => s.length > 1 && s.length < 50);
    if (segments.length >= 3) return segments;
  }
  void arrowPattern; void match;
  return null;
}

function AnalysisCard({
  result, onCopy, copySuccess,
}: {
  result: CaseAnalysis;
  onCopy: () => void;
  copySuccess: boolean;
}) {
  const { activePlan } = useApp();
  const [activeTab, setActiveTab] = useState<TabId>('sintese');
  const [modalOpen, setModalOpen] = useState(false);
  const [questionsModalOpen, setQuestionsModalOpen] = useState(false);
  const [hipoteseExpanded, setHipoteseExpanded] = useState(false);
  const [planoExpanded, setPlanoExpanded] = useState(false);
  const [perguntasExpanded, setPerguntasExpanded] = useState(false);

  const tabGate: Partial<Record<TabId, 'risco' | 'prontuario' | 'referencias'>> = {
    risco: 'risco',
    prontuario: 'prontuario',
    referencias: 'referencias',
  };

  function isTabLocked(tabId: TabId): boolean {
    const gate = tabGate[tabId];
    if (!gate) return false;
    return !planCanAccess(activePlan, gate);
  }

  const upgradeLabel: Partial<Record<TabId, string>> = {
    risco: 'Plano Plus',
    prontuario: 'Plano Plus',
    referencias: 'Plano Pro',
  };

  const nivel = deriveAtencao(result);
  const cfg = ATENCAO_CFG[nivel];

  function oneSentence(text: string, maxWords = 20): string {
    const first = text.split(/(?<=[.!?])\s+/)[0] ?? text;
    const words = first.trim().split(/\s+/);
    return words.length <= maxWords ? first.trim() : words.slice(0, maxWords).join(' ') + '…';
  }

  const resumo       = oneSentence(result.resumo_rapido    || result.hypothesis, 20);
  const focoInicial  = oneSentence(result.foco_inicial     || result.approaches[0] || '—', 20);
  const proxPergunta = result.proxima_pergunta  || result.questions[0] || '—';
  const hipotese     = result.hipotese_central  || result.hypothesis;
  const fatores      = result.fatores_relevantes || result.approaches.slice(0, 5);
  const plano        = result.plano_imediato    || result.approaches.slice(0, 3);
  const perguntas    = result.perguntas_clinicas || result.questions.slice(0, 5);

  // ciclo clínico extraído da hipótese
  const clinicalCycle = extractClinicalCycle(hipotese);
  // parágrafos da hipótese
  const hipoteseParagraphs = hipotese.split(/\n{1,2}/).filter(p => p.trim());

  const tabs: { id: TabId; label: string; content: string }[] = [
    { id: 'sintese',      label: 'Síntese',         content: result.sintese          || result.blind_spot },
    { id: 'formulacao',   label: 'Formulação',       content: result.formulacao       || result.hypothesis },
    { id: 'risco',        label: 'Risco e proteção', content: result.risco_e_protecao || (result.alerts || []).join('\n') || 'Sem alertas identificados.' },
    { id: 'intervencoes', label: 'Intervenções',     content: result.intervencoes     || result.approaches.join('\n') },
    { id: 'prontuario',   label: 'Prontuário',       content: result.prontuario       || '' },
    { id: 'referencias',  label: 'Referências',      content: result.referencias_texto || result.references.join('\n') },
  ];

  const activeContent = tabs.find(t => t.id === activeTab)?.content || '';

  const PLANO_VISIBLE = 3;
  const PERGUNTAS_VISIBLE = 3;
  const planoVisiveis = planoExpanded ? plano : plano.slice(0, PLANO_VISIBLE);
  const perguntasVisiveis = perguntasExpanded ? perguntas : perguntas.slice(0, PERGUNTAS_VISIBLE);

  return (
    <div className="space-y-5">
      {/* ── Banner de risco alto ── */}
      {nivel === 'alto' && (
        <div className="rounded-xl border-l-4 border-red-500 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700 leading-snug flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
          Risco identificado — Avalie protocolo de segurança antes da próxima sessão
        </div>
      )}

      {/* Card header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-widest text-blue-600">Mapa clínico</span>
            <h3 className="text-sm font-semibold text-slate-800 leading-none mt-0.5">Formulação compacta</h3>
          </div>
        </div>
      </div>

      {/* ── 4 cards de resumo ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

        {/* Resumo rápido */}
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 flex flex-col min-h-[120px] shadow-sm">
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-blue-500">
            Resumo rápido
          </span>
          <p className="mt-2 text-[13px] leading-[1.55] text-blue-950 line-clamp-3">{resumo}</p>
        </div>

        {/* Atenção clínica */}
        <div className={`rounded-xl border p-3 flex flex-col min-h-[120px] shadow-sm ${cfg.bg} ${cfg.border}`}>
          <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-widest ${cfg.color}`}>
            Atenção clínica
          </span>
          <span className={`mt-2 shrink-0 inline-block self-start rounded-full px-2 py-0.5 text-[11px] font-semibold ${cfg.badge}`}>
            {cfg.label}
          </span>
          <ul className="mt-2 space-y-1">
            {cfg.bullets.slice(0, 2).map((b, i) => (
              <li key={i} className={`flex items-start gap-1.5 text-[11px] leading-snug ${cfg.color} opacity-80`}>
                <span className="mt-1.5 w-1 h-1 rounded-full bg-current shrink-0" />
                <span className="line-clamp-2">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Foco inicial */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 flex flex-col min-h-[120px] shadow-sm">
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Foco inicial
          </span>
          <p className="mt-2 text-[13px] leading-[1.55] text-slate-700 line-clamp-3">{focoInicial}</p>
        </div>

        {/* Próxima pergunta */}
        <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3 flex flex-col min-h-[120px] shadow-sm">
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-amber-600">
            Próxima pergunta
          </span>
          <p
            className="mt-2 text-[13px] italic leading-[1.55] text-slate-700 line-clamp-3"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            &ldquo;{proxPergunta}&rdquo;
          </p>
        </div>

      </div>

      {/* ── Hipótese central ── */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 shadow-sm">
        <h4 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
          <Brain className="h-3.5 w-3.5 text-blue-600" />
          Hipótese central
        </h4>

        {/* Primeiras 2 linhas do primeiro parágrafo */}
        <div className={`text-[14px] leading-[1.65] text-slate-700 ${hipoteseExpanded ? '' : 'line-clamp-2'}`} style={{ fontFamily: 'Georgia, serif' }}>
          {renderMd(hipoteseParagraphs[0] || hipotese)}
        </div>

        {/* Ciclo clínico ou chips de fatores */}
        {clinicalCycle ? (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {clinicalCycle.map((step, i) => (
              <React.Fragment key={i}>
                <span className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-[12px] font-medium text-blue-700">
                  {step}
                </span>
                {i < clinicalCycle.length - 1 && (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                )}
              </React.Fragment>
            ))}
          </div>
        ) : fatores.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {fatores.slice(0, 4).map((f, i) => (
              <span key={i} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-sm">
                {f.length > 35 ? f.slice(0, 35) + '…' : f}
              </span>
            ))}
          </div>
        ) : null}

        {/* Expansão */}
        {hipoteseParagraphs.length > 1 && (
          <button
            onClick={() => setHipoteseExpanded(v => !v)}
            className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            {hipoteseExpanded ? (
              <><ChevronDown className="w-3.5 h-3.5 rotate-180" /> Recolher</>
            ) : (
              <><ChevronDown className="w-3.5 h-3.5" /> Ver hipótese completa</>
            )}
          </button>
        )}
        {hipoteseExpanded && hipoteseParagraphs.slice(1).map((para, i) => (
          <div key={i} className="mt-3 text-[14px] leading-[1.65] text-slate-600" style={{ fontFamily: 'Georgia, serif' }}>
            {renderMd(para)}
          </div>
        ))}
      </div>

      {/* ── Plano imediato ── */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 shadow-sm">
        <h4 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
          Plano imediato
        </h4>
        <ol className="flex flex-col gap-2">
          {planoVisiveis.map((p, i) => (
            <li
              key={i}
              className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white mt-0.5">
                {i + 1}
              </span>
              <div className="text-[13px] leading-[1.6] text-slate-700 line-clamp-2">
                {renderMd(p)}
              </div>
            </li>
          ))}
        </ol>
        {plano.length > PLANO_VISIBLE && (
          <button
            onClick={() => setPlanoExpanded(v => !v)}
            className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            {planoExpanded ? (
              <><ChevronDown className="w-3.5 h-3.5 rotate-180" /> Recolher passos</>
            ) : (
              <><ChevronDown className="w-3.5 h-3.5" /> Ver mais {plano.length - PLANO_VISIBLE} passos</>
            )}
          </button>
        )}
      </div>

      {/* ── Perguntas clínicas ── */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 shadow-sm">
        <h4 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
          <HelpCircle className="h-3.5 w-3.5 text-amber-600" />
          Perguntas clínicas
        </h4>
        <ul className="divide-y divide-slate-100">
          {perguntasVisiveis.map((q, i) => (
            <li key={i} className="flex items-start gap-3 py-2.5 first:pt-0">
              <span
                className="shrink-0 mt-0.5 text-[20px] font-serif leading-none text-blue-200"
                style={{ lineHeight: 1 }}
              >
                &ldquo;
              </span>
              <p
                className="text-[13px] italic leading-[1.6] text-slate-700 line-clamp-2"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                {q}
              </p>
            </li>
          ))}
        </ul>
        {perguntas.length > PERGUNTAS_VISIBLE && (
          <button
            onClick={() => setPerguntasExpanded(v => !v)}
            className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            {perguntasExpanded ? (
              <><ChevronDown className="w-3.5 h-3.5 rotate-180" /> Recolher perguntas</>
            ) : (
              <><ChevronDown className="w-3.5 h-3.5" /> Ver mais {perguntas.length - PERGUNTAS_VISIBLE} perguntas</>
            )}
          </button>
        )}
      </div>

      {/* ── Abas ── */}
      <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
        <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50">
          {tabs.map((tab) => {
            const locked = isTabLocked(tab.id);
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => !locked && setActiveTab(tab.id)}
                className={`shrink-0 py-3 px-5 text-[12px] font-semibold transition-all flex items-center gap-1.5 ${
                  locked
                    ? 'text-slate-400 cursor-not-allowed opacity-60'
                    : isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-white/80 hover:text-slate-700'
                }`}
              >
                {tab.label}
                {locked && <Lock className="w-3 h-3 shrink-0" />}
              </button>
            );
          })}
        </div>
        <div className="min-h-[96px] bg-white p-5">
          {isTabLocked(activeTab) ? (
            <div className="flex flex-col items-center justify-center gap-2 py-6">
              <Lock className="w-5 h-5 text-slate-300" />
              <p className="text-[13px] text-slate-500 text-center">
                Disponível no <span className="font-semibold">{upgradeLabel[activeTab]}</span>
              </p>
              <a href="/pricing" className="text-[13px] font-semibold text-blue-600 hover:underline">
                Fazer upgrade →
              </a>
            </div>
          ) : activeContent ? (
            <div>
              <div className="line-clamp-8 text-[14px] text-slate-600">
                <FormattedText text={activeContent} />
              </div>
              {activeContent.length > 200 && (
                <button
                  onClick={() => setModalOpen(true)}
                  className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Ver completo <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <p className="text-[13px] italic text-slate-400">Não disponível para este caso.</p>
          )}
        </div>
      </div>

      {/* ── Botões de ação — hierarquia visual ── */}
      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
        {/* Primário */}
        {planCanAccess(activePlan, 'prontuario') ? (
          <button
            onClick={() => { setActiveTab('prontuario'); setModalOpen(true); }}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_6px_16px_rgba(37,99,235,0.25)] transition-all hover:bg-blue-500 hover:-translate-y-0.5"
          >
            <Zap className="w-3.5 h-3.5" /> Gerar nota de evolução
          </button>
        ) : (
          <a href="/pricing" className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2.5 text-[13px] font-semibold text-slate-400 cursor-not-allowed">
            <Lock className="w-3.5 h-3.5" /> Gerar nota de evolução
          </a>
        )}
        {/* Secundário */}
        <button
          onClick={onCopy}
          className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-4 py-2.5 text-[13px] font-semibold text-blue-600 transition-all hover:bg-blue-50 hover:border-blue-300"
        >
          {copySuccess ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copySuccess ? 'Copiado!' : 'Copiar síntese'}
        </button>
        {/* Terciários */}
        {planCanAccess(activePlan, 'perguntas_roteiro') ? (
          <button
            onClick={() => setQuestionsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-[13px] font-semibold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50"
          >
            <HelpCircle className="w-3.5 h-3.5" /> Gerar roteiro de perguntas
          </button>
        ) : (
          <a href="/pricing" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-[13px] font-semibold text-slate-400 cursor-not-allowed">
            <Lock className="w-3.5 h-3.5" /> Gerar roteiro de perguntas
          </a>
        )}
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-[13px] font-semibold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50"
        >
          <Eye className="w-3.5 h-3.5" /> Ver análise detalhada
        </button>
      </div>

      {/* ── Modal análise detalhada ── */}
      {modalOpen && (() => {
        const tabMeta: Record<TabId, { icon: React.ReactNode; accent: string; bg: string; border: string }> = {
          sintese:      { icon: <Brain className="w-4 h-4" />,         accent: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-100' },
          formulacao:   { icon: <FileText className="w-4 h-4" />,      accent: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
          risco:        { icon: <AlertTriangle className="w-4 h-4" />, accent: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-100' },
          intervencoes: { icon: <Zap className="w-4 h-4" />,           accent: 'text-emerald-600',bg: 'bg-emerald-50',border: 'border-emerald-100' },
          prontuario:   { icon: <BookOpen className="w-4 h-4" />,      accent: 'text-slate-600',  bg: 'bg-slate-50',  border: 'border-slate-200' },
          referencias:  { icon: <BookOpen className="w-4 h-4" />,      accent: 'text-slate-600',  bg: 'bg-slate-50',  border: 'border-slate-200' },
        };
        const meta = tabMeta[activeTab] ?? tabMeta.sintese;
        const activeLabel = tabs.find(t => t.id === activeTab)?.label || 'Análise detalhada';
        return (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 animate-backdrop-in"
            onClick={() => setModalOpen(false)}
          >
            <div
              className="relative w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[82vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl animate-modal-in overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className={`flex items-center justify-between px-6 py-4 ${meta.bg} border-b ${meta.border}`}>
                <div className="flex items-center gap-2.5">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${meta.bg} ${meta.accent} ring-1 ${meta.border}`}>
                    {meta.icon}
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Análise detalhada</p>
                    <h3 className={`text-sm font-bold ${meta.accent}`}>{activeLabel}</h3>
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/70 text-slate-500 hover:bg-white hover:text-slate-800 transition-colors shadow-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-6 text-[15px]">
                <FormattedText text={activeContent} />
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-3">
                <div className="flex gap-1.5">
                  {tabs.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={`h-1.5 rounded-full transition-all ${t.id === activeTab ? 'w-6 bg-blue-600' : 'w-1.5 bg-slate-200 hover:bg-slate-300'}`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(activeContent)}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-[12px] font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" /> Copiar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Modal perguntas clínicas ── */}
      {questionsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-backdrop-in">
          <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl bg-white shadow-2xl animate-modal-in">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-semibold text-slate-800">Roteiro de perguntas</h3>
              </div>
              <button
                onClick={() => setQuestionsModalOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <p className="mb-4 text-[13px] text-slate-400">Perguntas sugeridas para explorar com o paciente na próxima sessão.</p>
              <ol className="space-y-4">
                {(result.perguntas_clinicas || result.questions || []).map((q, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[11px] font-bold text-amber-700">
                      {i + 1}
                    </span>
                    <p className="text-[15px] italic leading-[1.7] text-slate-700" style={{ fontFamily: 'Georgia, serif' }}>
                      &ldquo;{q}&rdquo;
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════ PatientSelector ════════════════════ */

interface PatientSelectorProps {
  patients: Patient[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onNewPatient: () => void;
}

function PatientSelector({ patients, selectedId, onSelect, onNewPatient }: PatientSelectorProps) {
  const [open, setOpen] = useState(false);
  const selected = patients.find(p => p.id === selectedId);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-all ${
          open ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-200'
        } bg-white`}
      >
        <span className="flex items-center gap-2 min-w-0">
          <Users className="h-4 w-4 shrink-0 text-slate-400" />
          {selected ? (
            <span className="truncate font-medium text-slate-800">{selected.pseudonym}</span>
          ) : (
            <span className="text-slate-400">Selecionar paciente (opcional)</span>
          )}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-40 left-0 right-0 top-full mt-1.5 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          {selectedId && (
            <button
              type="button"
              onClick={() => { onSelect(null); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-500 hover:bg-slate-50 border-b border-slate-100"
            >
              <X className="h-3.5 w-3.5" /> Remover vínculo
            </button>
          )}
          <div className="max-h-48 overflow-y-auto">
            {patients.length === 0 ? (
              <p className="px-3 py-3 text-xs text-slate-400">Nenhum paciente cadastrado ainda.</p>
            ) : (
              patients.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { onSelect(p.id); setOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors ${
                    p.id === selectedId ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-bold shrink-0">
                    {p.pseudonym.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <span className="block text-sm font-medium text-slate-800 truncate">{p.pseudonym}</span>
                    {p.age_range && <span className="block text-[10px] text-slate-400">{p.age_range}</span>}
                  </div>
                  {p.id === selectedId && <Check className="h-3.5 w-3.5 text-blue-600 ml-auto shrink-0" />}
                </button>
              ))
            )}
          </div>
          <button
            type="button"
            onClick={() => { onNewPatient(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 border-t border-slate-100"
          >
            <UserPlus className="h-4 w-4" /> Novo paciente
          </button>
        </div>
      )}
    </div>
  );
}

/* ════════════════════ NewPatientModal ════════════════════ */

interface NewPatientModalProps {
  onClose: () => void;
  onSave: (patient: Patient) => void;
}

const EMPTY_PATIENT_FORM = {
  pseudonym: '', age_range: '', entry_reason: '', initial_diagnosis: '', approach: '',
};

function NewPatientModal({ onClose, onSave }: NewPatientModalProps) {
  const { addPatient } = useApp();
  const [form, setForm] = useState(EMPTY_PATIENT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pseudonym.trim()) { setError('Pseudônimo é obrigatório.'); return; }
    setSaving(true);
    try {
      const patient = await addPatient({
        pseudonym: form.pseudonym.trim(),
        age_range: form.age_range.trim(),
        gender: '',
        occupation: '',
        marital_status: '',
        entry_reason: form.entry_reason.trim(),
        initial_diagnosis: form.initial_diagnosis.trim(),
        approach: form.approach.trim(),
        previous_therapy: null,
        previous_therapy_notes: '',
        medication: '',
        referral_source: '',
        medication_use: '',
        sessions_count: '',
      });
      onSave(patient);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar paciente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-800">Novo paciente</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Pseudônimo <span className="text-rose-500">*</span>
            </label>
            <input
              type="text" value={form.pseudonym} onChange={set('pseudonym')} required
              placeholder="Ex: Marcos, Paciente A..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Faixa etária</label>
              <input
                type="text" value={form.age_range} onChange={set('age_range')}
                placeholder="Ex: 30-40"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Diagnóstico inicial</label>
              <input
                type="text" value={form.initial_diagnosis} onChange={set('initial_diagnosis')}
                placeholder="Ex: F41.1"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Motivo de entrada</label>
            <input
              type="text" value={form.entry_reason} onChange={set('entry_reason')}
              placeholder="Ex: Ansiedade generalizada, conflitos relacionais..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Abordagem</label>
            <input
              type="text" value={form.approach} onChange={set('approach')}
              placeholder="Ex: TCC, Psicanálise..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <div className="flex items-center gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-[2] rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
              {saving ? 'Salvando...' : 'Cadastrar paciente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ════════════════════ SessionNotes ════════════════════ */

interface SessionNotesProps {
  sessionId: string;
  patientName: string;
}

function SessionNotes({ sessionId, patientName }: SessionNotesProps) {
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!note.trim()) return;
    setSaving(true);
    try {
      await supabase.from('sessions').update({ therapist_notes: note.trim() }).eq('id', sessionId);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="h-4 w-4 text-slate-400" />
        <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
          Nota da sessão — {patientName}
        </span>
      </div>
      {saved ? (
        <div className="flex items-center gap-2 py-2 text-emerald-600">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Nota salva com sucesso.</span>
        </div>
      ) : (
        <>
          <textarea
            rows={3}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="O que aconteceu nessa sessão? (opcional) — Ex: paciente trouxe melhora no sono, ainda resistente ao tema do pai..."
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={!note.trim() || saving}
            className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? 'Salvando...' : 'Salvar nota'}
          </button>
        </>
      )}
    </div>
  );
}

/* ════════════════════ main page ════════════════════ */

function NovaAnaliseContent({ requestedPatientId }: { requestedPatientId: string | null }) {
  const { user, cases, addCase, updateCase, setAnalysesUsed, patients, addPatient } = useApp();
  const router = useRouter();
  const initialPatient = patients.find(patient => patient.id === requestedPatientId);

  const [mode, setMode] = useState<Mode>('standard');

  /* patient */
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(initialPatient?.id || null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);
  const [patientSessionInfo, setPatientSessionInfo] = useState<{
    sessionCount: number;
    lastDate: string | null;
    lastLevel: string | null;
  } | null>(null);

  const handlePatientSelect = (id: string | null) => {
    setSelectedPatientId(id);
    setPatientSessionInfo(null);
    if (!id) {
      if (!isTitleManualRef.current) setTitle('');
      return;
    }
    setInputText('');
  };

  /* standard mode */
  const [title, setTitle]                   = useState('');
  const [inputText, setInputText]           = useState('');
  const [isAnalyzing, setIsAnalyzing]       = useState(false);
  const [analysisResult, setAnalysisResult] = useState<CaseAnalysis | null>(null);
  const [errorMessage, setErrorMessage]     = useState<string | null>(null);
  const [copySuccess, setCopySuccess]       = useState(false);

  /* audio recording */
  const [isRecording, setIsRecording]       = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef  = useRef<MediaRecorder | null>(null);
  const audioChunksRef    = useRef<Blob[]>([]);
  const onTranscribedRef  = useRef<((text: string) => void) | null>(null);
  const audioFileRef      = useRef<HTMLInputElement>(null);

  /* audio mode */
  const [audioTranscript, setAudioTranscript] = useState('');
  const [audioResult, setAudioResult]         = useState<CaseAnalysis | null>(null);
  const [audioError, setAudioError]           = useState<string | null>(null);
  const [isAudioAnalyzing, setIsAudioAnalyzing] = useState(false);
  const [audioCopySuccess, setAudioCopySuccess] = useState(false);

  const bottomRef      = useRef<HTMLDivElement>(null);
  const [pageOpenedAt] = useState(() => Date.now());

  /* configurações adicionais */
  const [configOpen, setConfigOpen]           = useState(false);
  const [sessionsCount, setSessionsCount]     = useState('');
  const [currentDiagnosis, setCurrentDiagnosis] = useState('');
  const [alreadyTried, setAlreadyTried]       = useState('');
  const [specificQuestion, setSpecificQuestion] = useState('');
  const [overrideApproach, setOverrideApproach] = useState(false);
  const [selectedApproach, setSelectedApproach] = useState('');
  const isTitleManualRef = useRef(false);

  useEffect(() => {
    if (!selectedPatientId) return;

    let cancelled = false;

    supabase
      .from('sessions')
      .select('id, created_at')
      .eq('patient_id', selectedPatientId)
      .order('created_at', { ascending: false })
      .then(({ data: sessions }) => {
        if (cancelled || !sessions) return;

        const sessionCount = sessions.length;
        const lastDate = sessionCount > 0 ? sessions[0].created_at : null;

        supabase
          .from('patient_memory')
          .select('attention_history')
          .eq('patient_id', selectedPatientId)
          .single()
          .then(({ data: memory }) => {
            if (cancelled) return;

            const history = (memory?.attention_history as Array<{ level: string }>) || [];
            const lastLevel = history.length > 0 ? history[history.length - 1].level : null;
            setPatientSessionInfo({ sessionCount, lastDate, lastLevel });
            if (!isTitleManualRef.current) {
              const pat = patients.find(p => p.id === selectedPatientId);
              if (pat) setTitle(`${pat.pseudonym} — Sessão ${sessionCount + 1}`);
            }
          });
      });

    return () => {
      cancelled = true;
    };
  }, [selectedPatientId]);

  /* ── auth token helper ── */
  const getAuthHeaders = async (): Promise<Record<string, string> | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    };
  };

  /* ── standard handlers ── */

  const handleReset = () => {
    setTitle(''); setInputText('');
    setAnalysisResult(null); setErrorMessage(null);
    setSavedSessionId(null);
    setSessionsCount(''); setCurrentDiagnosis('');
    setAlreadyTried(''); setSpecificQuestion('');
    setOverrideApproach(false); setSelectedApproach('');
    isTitleManualRef.current = false;
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText || inputText.trim().length < 10) return;
    setIsAnalyzing(true); setAnalysisResult(null); setErrorMessage(null);

    const selectedPat = patients.find(p => p.id === selectedPatientId);
    const defaultApproach = selectedPat?.approach?.trim() || user?.mainApproach || '';
    const approach = (overrideApproach && selectedApproach) ? selectedApproach : defaultApproach;
    const clinicalContext = {
      sessions_count: selectedPat && patientSessionInfo
        ? `Sessão ${patientSessionInfo.sessionCount + 1}`
        : sessionsCount,
      current_diagnosis: selectedPat?.initial_diagnosis?.trim() || currentDiagnosis,
      already_tried: alreadyTried,
      specific_question: specificQuestion,
    };

    try {
      const headers = await getAuthHeaders();
      if (!headers) {
        setErrorMessage('Sessão expirada. Faça login novamente.');
        setIsAnalyzing(false);
        return;
      }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title, input_text: inputText, approach,
          context: clinicalContext,
          patient_id: selectedPatientId || undefined,
          profile: {
            yearsExperience: user?.yearsExperience,
            patientTypes: user?.patientTypes,
            specialties: user?.specialties,
            approachDescription: user?.approachDescription,
            responseDetail: user?.responseDetail,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok)          setErrorMessage(data?.error || 'Não foi possível gerar a análise no momento.');
      else if (data?.analysis) {
        const analysis = data.analysis as CaseAnalysis;
        const savedCase = await addCase(title, inputText, approach, clinicalContext, analysis, {
          incrementUsage: false,
          patient_id: selectedPatientId || undefined,
        });
        if (data.session_id && savedCase?.id) {
          await supabase.from('sessions').update({ analysis_id: savedCase.id }).eq('id', data.session_id);
          setSavedSessionId(data.session_id);
        }
        if (typeof data.analysesUsed === 'number') setAnalysesUsed(data.analysesUsed);
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
    `PsiCoach AI — Análise\nAbordagem: ${user?.mainApproach}\n\nHIPÓTESE\n${result.hypothesis}\n\nABORDAGENS\n${result.approaches.map((a, i) => `${i + 1}. ${a}`).join('\n')}\n\nPERGUNTAS\n${result.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\nREFERÊNCIAS\n${result.references.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\nPONTO CEGO\n${result.blind_spot}\n\nALERTAS\n${result.alerts.map(a => `- ${a}`).join('\n')}`;

  const handleCopyText = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(buildCopyText(analysisResult));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  /* ── audio recording handlers ── */

  const transcribeAudio = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const headers = await getAuthHeaders();
      if (!headers) { setAudioError('Sessão expirada. Faça login novamente.'); return; }

      const form = new FormData();
      form.append('audio', blob, 'recording.webm');

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { Authorization: headers['Authorization'] },
        body: form,
      });
      const data = await res.json();
      if (res.ok && data.text) {
        onTranscribedRef.current?.(data.text);
      } else if (!res.ok) {
        setAudioError(data?.error || 'Erro ao transcrever o áudio gravado.');
      }
    } catch (err) {
      setAudioError(err instanceof Error ? err.message : 'Falha de comunicação com o servidor.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const startRecording = async (onText: (text: string) => void) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      onTranscribedRef.current = onText;
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        transcribeAudio(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      // permission denied or unavailable — silently ignore
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAudioError(null);
    setIsTranscribing(true);
    try {
      const headers = await getAuthHeaders();
      if (!headers) { setAudioError('Sessão expirada. Faça login novamente.'); return; }
      const form = new FormData();
      form.append('audio', file, file.name);
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { Authorization: headers['Authorization'] },
        body: form,
      });
      const data = await res.json();
      if (res.ok && data.text)
        setAudioTranscript(prev => prev ? `${prev} ${data.text}` : data.text);
      else if (!res.ok)
        setAudioError(data?.error || 'Erro ao transcrever o arquivo de áudio.');
    } catch (err) {
      setAudioError(err instanceof Error ? err.message : 'Falha de comunicação com o servidor.');
    } finally {
      setIsTranscribing(false);
    }
  };

  /* ── audio mode handlers ── */

  const handleAudioReset = () => {
    setAudioTranscript('');
    setAudioResult(null);
    setAudioError(null);
  };

  const handleAudioAnalyze = async () => {
    if (!audioTranscript.trim() || audioTranscript.trim().length < 10) return;
    setIsAudioAnalyzing(true);
    setAudioResult(null);
    setAudioError(null);

    const selectedPat = patients.find(p => p.id === selectedPatientId);
    const defaultApproach = selectedPat?.approach?.trim() || user?.mainApproach || '';
    const approach = (overrideApproach && selectedApproach) ? selectedApproach : defaultApproach;
    const clinicalContext = {
      sessions_count: selectedPat && patientSessionInfo
        ? `Sessão ${patientSessionInfo.sessionCount + 1}`
        : sessionsCount,
      current_diagnosis: selectedPat?.initial_diagnosis?.trim() || currentDiagnosis,
      already_tried: alreadyTried,
      specific_question: specificQuestion,
    };

    try {
      const headers = await getAuthHeaders();
      if (!headers) { setAudioError('Sessão expirada. Faça login novamente.'); return; }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          input_text: audioTranscript, approach,
          context: clinicalContext,
          patient_id: selectedPatientId || undefined,
          profile: {
            yearsExperience: user?.yearsExperience,
            patientTypes: user?.patientTypes,
            specialties: user?.specialties,
            approachDescription: user?.approachDescription,
            responseDetail: user?.responseDetail,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) setAudioError(data?.error || 'Não foi possível gerar a análise.');
      else if (data?.analysis) {
        const savedCase = await addCase('Análise por áudio', audioTranscript, approach, clinicalContext, data.analysis as CaseAnalysis, {
          incrementUsage: false,
          patient_id: selectedPatientId || undefined,
        });
        if (data.session_id && savedCase?.id) {
          await supabase.from('sessions').update({ analysis_id: savedCase.id }).eq('id', data.session_id);
          setSavedSessionId(data.session_id);
        }
        if (typeof data.analysesUsed === 'number') setAnalysesUsed(data.analysesUsed);
        setAudioResult(data.analysis as CaseAnalysis);
      } else setAudioError('Resposta inesperada do servidor de IA.');
    } catch (err) {
      setAudioError(err instanceof Error ? err.message : 'Falha de comunicação com o servidor.');
    } finally {
      setIsAudioAnalyzing(false);
    }
  };

  const handleAudioCopy = () => {
    if (!audioResult) return;
    navigator.clipboard.writeText(buildCopyText(audioResult));
    setAudioCopySuccess(true);
    setTimeout(() => setAudioCopySuccess(false), 2000);
  };

  void router;

  /* ── derived from patient selection ── */
  const selectedPat = patients.find(p => p.id === selectedPatientId);
  const nextSessionNumber = selectedPat && patientSessionInfo
    ? patientSessionInfo.sessionCount + 1
    : null;
  const effectiveApproach = (overrideApproach && selectedApproach)
    ? selectedApproach
    : (selectedPat?.approach?.trim() || user?.mainApproach || '');
  void pageOpenedAt;

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
            onClick={() => setMode('audio')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${
              mode === 'audio'
                ? 'border border-slate-200 bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Mic className="h-4 w-4" /> Áudio
          </button>
          <Link
            href="/nova-analise/chat"
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 text-slate-500 hover:text-slate-700"
          >
            <MessageSquare className="h-4 w-4" /> Chat
          </Link>
        </div>
      </div>

      {/* ══════════════ STANDARD MODE ══════════════ */}
      {mode === 'standard' && (
        <div className="flex flex-col gap-4">

          {/* ── Entrada do caso ── */}
          <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm lg:p-5">
            {/* Section header */}
            <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <FileText className="h-3.5 w-3.5" />
              </div>
              <h2 className="text-[13px] font-semibold text-slate-800">Entrada do caso</h2>
            </div>

            <form onSubmit={handleAnalyze} className="space-y-3">
              {/* Linha superior: paciente + título */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Seletor de paciente */}
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                    Paciente
                  </label>
                  <PatientSelector
                    patients={patients}
                    selectedId={selectedPatientId}
                    onSelect={handlePatientSelect}
                    onNewPatient={() => setShowPatientModal(true)}
                  />
                  {selectedPat && (
                    <div className="animate-fade-in border-l-[3px] border-l-blue-500 bg-blue-50/30 pl-4 pr-3 py-2 flex items-center gap-1.5 flex-wrap min-h-[36px]">
                      <span className="text-[13px] font-medium text-slate-700">{selectedPat.pseudonym}</span>
                      {selectedPat.age_range && (
                        <>
                          <span className="text-[11px] text-slate-400">•</span>
                          <span className="text-[13px] text-slate-500">{selectedPat.age_range}</span>
                        </>
                      )}
                      {selectedPat.approach && (
                        <>
                          <span className="text-[11px] text-slate-400">•</span>
                          <span className="text-[12px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">{selectedPat.approach}</span>
                        </>
                      )}
                      {nextSessionNumber && (
                        <>
                          <span className="text-[11px] text-slate-400">•</span>
                          <span className="text-[13px] text-slate-500">Sessão {nextSessionNumber}</span>
                        </>
                      )}
                      {patientSessionInfo?.lastDate && (
                        <>
                          <span className="text-[11px] text-slate-400">•</span>
                          <span className="text-[13px] text-slate-500">
                            Última: {new Date(patientSessionInfo.lastDate).toLocaleDateString('pt-BR')}
                          </span>
                        </>
                      )}
                      {patientSessionInfo?.lastLevel && (() => {
                        const lvlCfg = {
                          baixo:    { label: 'Baixo',    dot: 'bg-emerald-500' },
                          moderado: { label: 'Moderado', dot: 'bg-amber-500'   },
                          alto:     { label: 'Alto',     dot: 'bg-rose-500'    },
                        }[patientSessionInfo.lastLevel as 'baixo' | 'moderado' | 'alto'];
                        if (!lvlCfg) return null;
                        return (
                          <>
                            <span className="text-[11px] text-slate-400">•</span>
                            <span className="flex items-center gap-1 text-[13px] text-slate-500">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${lvlCfg.dot}`} />
                              Atenção: {lvlCfg.label}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Título do caso */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                    Título do caso (opcional)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => { setTitle(e.target.value); isTitleManualRef.current = true; }}
                    placeholder="Ex: Caso G. — Fobia Social"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
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

              {/* ── Configurações adicionais ── */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setConfigOpen(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <span className="text-[13px] font-semibold text-slate-500">
                    {configOpen
                      ? '－ Configurações adicionais'
                      : '＋ Configurações adicionais — Aumente a precisão da análise'}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${configOpen ? 'rotate-180' : ''}`} />
                </button>

                {configOpen && (
                  <div className="px-4 py-4 space-y-3 border-t border-slate-100 bg-white">
                    {/* Linha 1: Sessões + Diagnóstico */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {/* Sessões */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Sessões</label>
                        {selectedPat ? (
                          <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[12px] font-medium text-blue-700">
                            {nextSessionNumber ? `Sessão ${nextSessionNumber}` : 'Carregando...'}
                            <em className="ml-1 font-normal not-italic text-blue-400"> • automático</em>
                          </span>
                        ) : (
                          <select
                            value={sessionsCount}
                            onChange={e => setSessionsCount(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          >
                            <option value="">Selecionar...</option>
                            <option value="Acolhimento (1-5)">Acolhimento (1-5)</option>
                            <option value="Inicial (6-15)">Inicial (6-15)</option>
                            <option value="Intermediário (16-30)">Intermediário (16-30)</option>
                            <option value="Avançado (30+)">Avançado (30+)</option>
                          </select>
                        )}
                      </div>
                      {/* Diagnóstico */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Diagnóstico</label>
                        {selectedPat?.initial_diagnosis?.trim() ? (
                          <span className="inline-flex items-center rounded-md border border-slate-300 bg-slate-100 px-2.5 py-1.5 text-[12px] font-medium text-slate-600">
                            {selectedPat.initial_diagnosis}
                            <em className="ml-1 font-normal not-italic text-slate-400"> • do perfil</em>
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={currentDiagnosis}
                            onChange={e => setCurrentDiagnosis(e.target.value)}
                            placeholder="Ex: F41.1, Sem diagnóstico fechado..."
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          />
                        )}
                      </div>
                    </div>

                    {/* Linha 2: Já foi trabalhado — sempre editável */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Já foi trabalhado</label>
                      <input
                        type="text"
                        value={alreadyTried}
                        onChange={e => setAlreadyTried(e.target.value)}
                        placeholder="Descreva intervenções já tentadas..."
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    {/* Linha 3: Dúvida específica — sempre editável */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Dúvida específica</label>
                      <input
                        type="text"
                        value={specificQuestion}
                        onChange={e => setSpecificQuestion(e.target.value)}
                        placeholder="Qual decisão clínica você precisa tomar?"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    {/* Linha 4: Diretriz teórica */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Diretriz teórica</label>
                      <div className="flex flex-wrap items-center gap-3">
                        {!overrideApproach && effectiveApproach && (
                          selectedPat ? (
                            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[12px] font-medium text-emerald-700">
                              <Check className="h-3 w-3" />
                              {effectiveApproach}
                              <em className="ml-1 font-normal not-italic text-emerald-500"> • do perfil</em>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[12px] font-semibold text-emerald-700">
                              <Check className="h-3 w-3" /> {effectiveApproach}
                            </span>
                          )
                        )}
                        <label className="flex items-center gap-2 cursor-pointer text-[13px] text-slate-500 select-none">
                          <input
                            type="checkbox"
                            checked={overrideApproach}
                            onChange={e => {
                              setOverrideApproach(e.target.checked);
                              if (!e.target.checked) setSelectedApproach('');
                            }}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-100"
                          />
                          Mudar
                        </label>
                        {overrideApproach && (
                          <select
                            value={selectedApproach}
                            onChange={e => setSelectedApproach(e.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          >
                            <option value="">Selecionar abordagem...</option>
                            <option value="TCC">TCC</option>
                            <option value="Psicanálise">Psicanálise</option>
                            <option value="Humanista">Humanista</option>
                            <option value="Sistêmica">Sistêmica</option>
                            <option value="Gestalt">Gestalt</option>
                            <option value="Junguiana">Junguiana</option>
                            <option value="Integrativa">Integrativa</option>
                            <option value="Outra">Outra</option>
                          </select>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Rodapé: aviso + botões */}
              <div className="flex items-center gap-3 pt-1">
                <div className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                  <Shield className="h-3 w-3 shrink-0 text-slate-400" />
                  <p className="text-[10px] text-slate-500">Use apenas dados anonimizados.</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50"
                  >
                    <RotateCcw className="h-4 w-4" /> Limpar
                  </button>
                  <button
                    type="submit"
                    disabled={inputText.trim().length < 10 || isAnalyzing}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(37,99,235,0.28)] transition-all hover:-translate-y-0.5 hover:bg-blue-500 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                  >
                    {isAnalyzing ? (
                      <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Processando...</>
                    ) : (
                      <><Play className="h-4 w-4 fill-current" /> Gerar análise</>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* ── Resultado (dossiê) ── */}
          <div className="flex flex-col">
            {errorMessage ? (
              <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-rose-200 bg-rose-50/40 p-8 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                  <AlertTriangle className="h-7 w-7" />
                </div>
                <h3 className="text-base font-semibold text-rose-700">Análise indisponível</h3>
                <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-rose-600">{errorMessage}</p>
                {errorMessage?.toLowerCase().includes('plano') ? (
                  <a
                    href="/pricing"
                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.28)] transition-all hover:-translate-y-0.5 hover:bg-blue-500"
                  >
                    Ver planos
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setErrorMessage(null); }}
                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-5 py-2.5 text-sm font-semibold text-rose-600 transition-all hover:bg-rose-50"
                  >
                    Tentar novamente
                  </button>
                )}
              </div>

            ) : !isAnalyzing && !analysisResult ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-16 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_12px_28px_rgba(37,99,235,0.28)]">
                  <Brain className="h-7 w-7" />
                </div>
                <h3 className="text-base font-semibold text-slate-800">Dossiê vazio</h3>
                <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-slate-500">
                  Digite o relato e clique em <strong className="text-slate-700">Gerar análise</strong>. O copiloto formulará a hipótese e indicará eixos terapêuticos.
                </p>
              </div>

            ) : isAnalyzing ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-100 bg-white p-16 text-center shadow-sm">
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
                    {user?.mainApproach}
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
                {savedSessionId && selectedPatientId && (() => {
                  const pat = patients.find(p => p.id === selectedPatientId);
                  return pat ? <SessionNotes sessionId={savedSessionId} patientName={pat.pseudonym} /> : null;
                })()}
                <div ref={bottomRef} />
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ══════════════ AUDIO MODE ══════════════ */}
      {mode === 'audio' && (
        <div className="flex flex-col gap-4">

          {/* ── Coluna esquerda — Gravação ── */}
          <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm lg:p-5">
            <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Mic className="h-3.5 w-3.5" />
              </div>
              <h2 className="text-[13px] font-semibold text-slate-800">Entrada por áudio</h2>
            </div>

            <div className="space-y-4">
              {/* Seletor de paciente */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  Paciente
                </label>
                <PatientSelector
                  patients={patients}
                  selectedId={selectedPatientId}
                  onSelect={handlePatientSelect}
                  onNewPatient={() => setShowPatientModal(true)}
                />
                {selectedPat && (
                  <div className="animate-fade-in border-l-[3px] border-l-blue-500 bg-blue-50/30 pl-4 pr-3 py-2 flex items-center gap-1.5 flex-wrap min-h-[36px]">
                    <span className="text-[13px] font-medium text-slate-700">{selectedPat.pseudonym}</span>
                    {selectedPat.age_range && (
                      <>
                        <span className="text-[11px] text-slate-400">•</span>
                        <span className="text-[13px] text-slate-500">{selectedPat.age_range}</span>
                      </>
                    )}
                    {selectedPat.approach && (
                      <>
                        <span className="text-[11px] text-slate-400">•</span>
                        <span className="text-[12px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">{selectedPat.approach}</span>
                      </>
                    )}
                    {nextSessionNumber && (
                      <>
                        <span className="text-[11px] text-slate-400">•</span>
                        <span className="text-[13px] text-slate-500">Sessão {nextSessionNumber}</span>
                      </>
                    )}
                    {patientSessionInfo?.lastDate && (
                      <>
                        <span className="text-[11px] text-slate-400">•</span>
                        <span className="text-[13px] text-slate-500">
                          Última: {new Date(patientSessionInfo.lastDate).toLocaleDateString('pt-BR')}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Gravar + Upload */}
              <div className="grid grid-cols-2 gap-3">
                {/* Record */}
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 py-5">
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : () => startRecording(text =>
                      setAudioTranscript(prev => prev ? `${prev} ${text}` : text)
                    )}
                    disabled={isTranscribing || isAudioAnalyzing}
                    className={`relative flex h-14 w-14 items-center justify-center rounded-full transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
                      isRecording
                        ? 'bg-rose-500 text-white shadow-[0_0_0_8px_rgba(239,68,68,0.15)]'
                        : 'bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.32)] hover:bg-blue-500 hover:-translate-y-0.5'
                    }`}
                  >
                    {isRecording && <span className="absolute inset-0 animate-ping rounded-full bg-rose-400 opacity-30" />}
                    {isTranscribing ? (
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : isRecording ? (
                      <Square className="h-5 w-5 fill-current" />
                    ) : (
                      <Mic className="h-5 w-5" />
                    )}
                  </button>
                  <p className="text-center text-[11px] font-medium text-slate-500 leading-snug">
                    {isTranscribing ? 'Transcrevendo...' : isRecording ? 'Gravando...\nclique para parar' : 'Gravar agora'}
                  </p>
                </div>

                {/* Upload */}
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 py-5">
                  <input
                    ref={audioFileRef}
                    type="file"
                    accept="audio/mp3,audio/mpeg,audio/mp4,audio/wav,audio/webm,audio/ogg,audio/flac,audio/m4a,audio/*"
                    className="hidden"
                    onChange={handleAudioFileChange}
                  />
                  <button
                    type="button"
                    onClick={() => audioFileRef.current?.click()}
                    disabled={isRecording || isTranscribing || isAudioAnalyzing}
                    className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-slate-300 bg-white text-slate-400 transition-all hover:border-blue-400 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Upload className="h-5 w-5" />
                  </button>
                  <p className="text-center text-[11px] font-medium text-slate-500 leading-snug">
                    Enviar arquivo<br />
                    <span className="font-normal text-slate-400">mp3, wav, m4a…</span>
                  </p>
                </div>
              </div>

              {/* Transcript textarea */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                    Transcrição <span className="normal-case font-normal">(editável)</span>
                  </label>
                  <span className={`text-[10px] font-medium ${audioTranscript.length >= 200 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {audioTranscript.length} car.
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={audioTranscript}
                  onChange={e => setAudioTranscript(e.target.value)}
                  placeholder="O texto transcrito aparecerá aqui. Você também pode digitar ou editar livremente."
                  className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                {audioTranscript.length > 0 && audioTranscript.length < 200 && (
                  <p className="text-[10px] text-amber-600">Recomendado mínimo de 200 caracteres para análise mais precisa.</p>
                )}
              </div>

              <div className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                <Shield className="h-3 w-3 shrink-0 text-slate-400" />
                <p className="text-[10px] text-slate-500">Use apenas dados anonimizados.</p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleAudioReset}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50"
                >
                  <RotateCcw className="h-4 w-4" /> Limpar
                </button>
                <button
                  type="button"
                  onClick={handleAudioAnalyze}
                  disabled={audioTranscript.trim().length < 10 || isAudioAnalyzing || isRecording || isTranscribing}
                  className="inline-flex flex-[2] items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(37,99,235,0.28)] transition-all hover:-translate-y-0.5 hover:bg-blue-500 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                >
                  {isAudioAnalyzing ? (
                    <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Processando...</>
                  ) : (
                    <><Play className="h-4 w-4 fill-current" /> Gerar análise</>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ── Resultado áudio ── */}
          <div>
            {audioError ? (
              <div className="flex flex-col items-center justify-center rounded-3xl py-16 border border-rose-200 bg-rose-50/40 p-8 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                  <AlertTriangle className="h-7 w-7" />
                </div>
                <h3 className="text-base font-semibold text-rose-700">Análise indisponível</h3>
                <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-rose-600">{audioError}</p>
                {audioError?.toLowerCase().includes('plano') ? (
                  <a
                    href="/pricing"
                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.28)] transition-all hover:-translate-y-0.5 hover:bg-blue-500"
                  >
                    Ver planos
                  </a>
                ) : null}
              </div>
            ) : !isAudioAnalyzing && !audioResult ? (
              <div className="flex flex-col items-center justify-center rounded-3xl py-16 border border-dashed border-slate-200 bg-white p-8 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_12px_28px_rgba(37,99,235,0.28)]">
                  <Mic className="h-7 w-7" />
                </div>
                <h3 className="text-base font-semibold text-slate-800">Grave o relato clínico</h3>
                <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-slate-500">
                  Clique no botão de microfone, descreva o caso em voz alta e depois clique em <strong className="text-slate-700">Gerar análise</strong>.
                </p>
              </div>
            ) : isAudioAnalyzing ? (
              <div className="flex flex-col items-center justify-center rounded-3xl py-16 border border-slate-100 bg-white p-8 text-center shadow-sm">
                <div className="relative mb-5">
                  <div className="absolute -inset-4 animate-ping rounded-full bg-blue-100 blur-2xl" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white">
                    <Brain className="h-8 w-8 animate-pulse" />
                  </div>
                </div>
                <span className="section-badge">Processando</span>
                <h3 className="mt-3 text-base font-semibold text-slate-800">Tecendo formulações clínicas...</h3>
                <div className="mt-5 h-1 w-40 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-[70%] animate-pulse rounded-full bg-blue-600" />
                </div>
              </div>
            ) : audioResult ? (
              <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm lg:p-6">
                <AnalysisCard
                  result={audioResult}
                  onCopy={handleAudioCopy}
                  copySuccess={audioCopySuccess}
                />
                {savedSessionId && selectedPatientId && (() => {
                  const pat = patients.find(p => p.id === selectedPatientId);
                  return pat ? <SessionNotes sessionId={savedSessionId} patientName={pat.pseudonym} /> : null;
                })()}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Modal novo paciente */}
      {showPatientModal && (
        <NewPatientModal
          onClose={() => setShowPatientModal(false)}
          onSave={(patient) => {
            handlePatientSelect(patient.id);
            setShowPatientModal(false);
          }}
        />
      )}
    </div>
  );
}

export default function NovaAnalise() {
  return (
    <Suspense fallback={<div className="min-h-[420px] animate-pulse rounded-3xl bg-slate-100" />}>
      <NovaAnaliseFromUrl />
    </Suspense>
  );
}

function NovaAnaliseFromUrl() {
  const searchParams = useSearchParams();
  const { patients } = useApp();
  const requestedPatientId = searchParams.get('patient');
  const requestedPatient = requestedPatientId
    ? patients.find(patient => patient.id === requestedPatientId)
    : null;

  if (requestedPatientId && !requestedPatient) {
    return <div className="min-h-[420px] animate-pulse rounded-3xl bg-slate-100" />;
  }

  return (
    <NovaAnaliseContent
      key={requestedPatient?.updated_at || requestedPatientId || 'new-analysis'}
      requestedPatientId={requestedPatientId}
    />
  );
}
