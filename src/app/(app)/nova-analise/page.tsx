'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useApp, CaseAnalysis, planCanAccess } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import {
  Brain, Sparkles, ChevronDown, Play, RotateCcw, Copy,
  AlertTriangle, HelpCircle, BookOpen, Eye, FileText, TrendingUp,
  CheckCircle, LayoutTemplate, Plus,
  Target, ChevronRight, X, Shield, Zap, Check, Mic, Square, Upload, Lock,
} from 'lucide-react';

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

const APPROACH_OPTIONS = [
  {
    value: 'TCC (Terapia Cognitivo-Comportamental)',
    label: 'TCC',
    description: 'Pensamentos, crenças e experimentos comportamentais',
  },
  {
    value: 'Psicanálise',
    label: 'Psicanálise',
    description: 'Inconsciente, transferência e elaboração',
  },
  {
    value: 'Humanista / Fenomenologia',
    label: 'Humanista',
    description: 'Experiência vivida, vínculo e autenticidade',
  },
  {
    value: 'Sistêmica / Terapia Familiar',
    label: 'Sistêmica',
    description: 'Relações, padrões familiares e contexto',
  },
  {
    value: 'Gestalt-terapia',
    label: 'Gestalt',
    description: 'Awareness, contato e aqui-agora',
  },
  {
    value: 'Junguiana / Psicologia Analítica',
    label: 'Junguiana',
    description: 'Símbolos, arquétipos e individuação',
  },
] as const;

/* ══════════════════════ Markdown helpers ══════════════════════ */

function renderMd(text: string) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => (
          <p style={{ color: '#374151', lineHeight: 1.8, marginBottom: '0.75rem' }}>{children}</p>
        ),
        strong: ({ children }) => (
          <strong style={{ fontWeight: 600, color: '#1e293b' }}>{children}</strong>
        ),
        li: ({ children }) => (
          <li style={{ color: '#374151', lineHeight: 1.8 }}>{children}</li>
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
    <div className="space-y-0" style={{ color: '#374151', lineHeight: 1.8 }}>
      {paragraphs.map((para, i) => (
        <div key={i} style={{ color: '#374151', lineHeight: 1.8 }}>
          {renderMd(para)}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════ AnalysisCard ══════════════════════ */

type TabId = 'sintese' | 'formulacao' | 'fatores' | 'risco' | 'intervencoes' | 'prontuario' | 'referencias';

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

  const fatoresContent = fatores.map((f, i) => `${i + 1}. ${f}`).join('\n');

  const tabs: { id: TabId; label: string; content: string }[] = [
    { id: 'sintese',      label: 'Síntese',             content: result.sintese          || result.blind_spot },
    { id: 'formulacao',   label: 'Formulação',           content: result.formulacao       || result.hypothesis },
    { id: 'fatores',      label: 'Fatores relevantes',   content: fatoresContent },
    { id: 'risco',        label: 'Risco e proteção',     content: result.risco_e_protecao || (result.alerts || []).join('\n') || 'Sem alertas identificados.' },
    { id: 'intervencoes', label: 'Intervenções',         content: result.intervencoes     || result.approaches.join('\n') },
    { id: 'prontuario',   label: 'Prontuário',           content: result.prontuario       || '' },
    { id: 'referencias',  label: 'Referências',          content: result.referencias_texto || result.references.join('\n') },
  ];

  const activeContent = tabs.find(t => t.id === activeTab)?.content || '';

  return (
    <div className="space-y-6">
      {/* ── Banner de risco alto ── */}
      {nivel === 'alto' && (
        <div className="rounded-xl border-l-4 border-red-600 bg-red-50 px-4 py-4 text-[14px] font-medium text-red-700 leading-snug">
          ⚠️ Risco identificado — Avalie protocolo de segurança antes da próxima sessão
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
        <button
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          <Copy className="w-3.5 h-3.5" />
          {copySuccess ? 'Copiado!' : 'Copiar'}
        </button>
      </div>

      {/* ── 4 cards superiores — altura fixa 160px ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

        {/* Resumo rápido — 1 frase, máx 20 palavras */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 flex flex-col h-40 overflow-hidden">
          <span className="shrink-0 text-[11px] font-semibold uppercase text-blue-600" style={{ letterSpacing: '0.8px' }}>
            Resumo rápido
          </span>
          <p className="mt-3 text-[14px] leading-[1.6] text-blue-950">{resumo}</p>
        </div>

        {/* Atenção clínica — badge + 2 bullets */}
        <div className={`rounded-2xl border p-4 flex flex-col h-40 overflow-hidden ${cfg.bg} ${cfg.border}`}>
          <span className={`shrink-0 text-[11px] font-semibold uppercase ${cfg.color}`} style={{ letterSpacing: '0.8px' }}>
            Atenção clínica
          </span>
          <span className={`mt-2 shrink-0 inline-block self-start rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${cfg.badge}`}>
            {cfg.label}
          </span>
          <ul className="mt-2.5 space-y-1.5">
            {cfg.bullets.slice(0, 2).map((b, i) => (
              <li key={i} className={`flex items-start gap-1.5 text-[12px] leading-snug ${cfg.color} opacity-85`}>
                <span className="mt-1.5 w-1 h-1 rounded-full bg-current shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Foco inicial — 1 frase de decisão */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col h-40 overflow-hidden">
          <span className="shrink-0 text-[11px] font-semibold uppercase text-slate-500" style={{ letterSpacing: '0.8px' }}>
            Foco inicial
          </span>
          <p className="mt-3 text-[14px] leading-[1.6] text-slate-700">{focoInicial}</p>
        </div>

        {/* Próxima pergunta — a pergunta em itálico */}
        <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 flex flex-col h-40 overflow-hidden">
          <span className="shrink-0 text-[11px] font-semibold uppercase text-amber-600" style={{ letterSpacing: '0.8px' }}>
            Próxima pergunta
          </span>
          <p
            className="mt-3 text-[14px] italic leading-[1.6] text-slate-700"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            &ldquo;{proxPergunta}&rdquo;
          </p>
        </div>

      </div>

      {/* ── Hipótese central — largura total ── */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
        <h4 className="mb-4 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-widest text-slate-500">
          <Brain className="h-4 w-4 text-blue-600" />
          Hipótese central
        </h4>
        <div style={{ fontFamily: 'Georgia, serif' }}>
          {hipotese.split(/\n{1,2}/).filter(p => p.trim()).map((para, i) => (
            <div key={i}>
              {i === 0 ? (
                <div
                  style={{
                    background: '#F8FAFF',
                    borderLeft: '3px solid #3B82F6',
                    borderRadius: '6px',
                    padding: '12px 16px',
                    marginBottom: '20px',
                  }}
                >
                  {renderMd(para)}
                </div>
              ) : (
                <div
                  style={{
                    paddingTop: '16px',
                    paddingBottom: '16px',
                    borderBottom: i < hipotese.split(/\n{1,2}/).filter(p => p.trim()).length - 1
                      ? '1px solid #F3F4F6'
                      : 'none',
                  }}
                >
                  {renderMd(para)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Plano imediato — cards individuais ── */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
        <h4 className="mb-4 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-widest text-slate-500">
          <TrendingUp className="h-4 w-4 text-emerald-600" />
          Plano imediato
        </h4>
        <ol className="flex flex-col gap-3">
          {plano.map((p, i) => (
            <li
              key={i}
              className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[12px] font-bold text-white mt-0.5">
                {i + 1}
              </span>
              <div className="text-[14px] leading-[1.7]" style={{ color: '#374151' }}>
                {renderMd(p)}
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* ── Perguntas clínicas — largura total ── */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
        <h4 className="mb-3 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-widest text-slate-500">
          <HelpCircle className="h-4 w-4 text-amber-600" />
          Perguntas clínicas
        </h4>
        <ul className="divide-y divide-slate-100">
          {perguntas.slice(0, 5).map((q, i) => (
            <li key={i} className="flex items-start gap-3 py-2.5 first:pt-1">
              <span
                className="shrink-0 mt-0.5 text-[22px] font-serif leading-none"
                style={{ color: '#93C5FD', lineHeight: 1 }}
              >
                &ldquo;
              </span>
              <p
                className="text-[15px] italic leading-[1.7]"
                style={{ color: '#374151', fontFamily: 'Georgia, serif' }}
              >
                {q}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Abas ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50">
          {tabs.map((tab) => {
            const locked = isTabLocked(tab.id);
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => !locked && setActiveTab(tab.id)}
                className={`shrink-0 border-b-2 px-4 py-2.5 text-[12px] font-semibold transition-colors flex items-center gap-1.5 ${
                  locked
                    ? 'border-transparent text-slate-400 cursor-not-allowed'
                    : isActive
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-transparent text-slate-500 hover:bg-white/70 hover:text-slate-700'
                }`}
              >
                {tab.label}
                {locked && <Lock className="w-3 h-3 shrink-0" />}
              </button>
            );
          })}
        </div>
        <div className="min-h-[96px] bg-white p-6">
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
              <div className="line-clamp-6 text-[15px]">
                <FormattedText text={activeContent} />
              </div>
              {activeContent.length > 200 && (
                <button
                  onClick={() => setModalOpen(true)}
                  className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Ver análise detalhada <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <p className="text-[14px] italic text-slate-400">Não disponível para este caso.</p>
          )}
        </div>
      </div>

      {/* ── Botões de ação rápida ── */}
      <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        <button
          onClick={onCopy}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-[13px] font-semibold text-slate-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          <Copy className="w-3.5 h-3.5" /> Copiar síntese
        </button>
        {planCanAccess(activePlan, 'prontuario') ? (
          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-[13px] font-semibold text-slate-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
            <Zap className="w-3.5 h-3.5" /> Gerar nota de evolução
          </button>
        ) : (
          <a href="/pricing" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-5 py-3 text-[13px] font-semibold text-slate-400 cursor-not-allowed">
            <Lock className="w-3.5 h-3.5" /> Gerar nota de evolução
          </a>
        )}
        {planCanAccess(activePlan, 'perguntas_roteiro') ? (
          <button
            onClick={() => setQuestionsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-[13px] font-semibold text-slate-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            <HelpCircle className="w-3.5 h-3.5" /> Gerar roteiro de perguntas
          </button>
        ) : (
          <a href="/pricing" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-5 py-3 text-[13px] font-semibold text-slate-400 cursor-not-allowed">
            <Lock className="w-3.5 h-3.5" /> Gerar roteiro de perguntas
          </a>
        )}
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-[13px] font-semibold text-slate-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          <Eye className="w-3.5 h-3.5" /> Ver análise detalhada
        </button>
      </div>

      {/* ── Modal análise detalhada ── */}
      {modalOpen && (() => {
        const tabMeta: Record<TabId, { icon: React.ReactNode; accent: string; bg: string; border: string }> = {
          sintese:      { icon: <Brain className="w-4 h-4" />,         accent: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-100' },
          formulacao:   { icon: <FileText className="w-4 h-4" />,      accent: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
          fatores:      { icon: <Target className="w-4 h-4" />,        accent: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
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
            style={{ background: 'transparent' }}
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

/* ══════════════════ shared sub-panels ══════════════════ */

interface ContextPanelProps {
  sessionsCount: string;
  setSessionsCount: (v: string) => void;
  currentDiagnosis: string;
  setCurrentDiagnosis: (v: string) => void;
  alreadyTried: string;
  setAlreadyTried: (v: string) => void;
  specificQuestion: string;
  setSpecificQuestion: (v: string) => void;
}

function ContextPanel({
  sessionsCount, setSessionsCount,
  currentDiagnosis, setCurrentDiagnosis,
  alreadyTried, setAlreadyTried,
  specificQuestion, setSpecificQuestion,
}: ContextPanelProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/40">
      <div className="flex w-full items-center bg-white px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-slate-600">
        <span className="flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-blue-600" />
          Configurações adicionais
        </span>
      </div>
      <div className="space-y-3 border-t border-slate-100 bg-white p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Sessões <span className="normal-case font-normal">(opcional)</span></label>
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
              <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Diagnóstico <span className="normal-case font-normal">(opcional)</span></label>
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
            <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Já foi trabalhado <span className="normal-case font-normal">(opcional)</span></label>
            <input
              type="text"
              value={alreadyTried}
              onChange={e => setAlreadyTried(e.target.value)}
              placeholder="Ex: Psicoeducação do pânico..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-400"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Dúvida específica <span className="normal-case font-normal">(opcional)</span></label>
            <input
              type="text"
              value={specificQuestion}
              onChange={e => setSpecificQuestion(e.target.value)}
              placeholder="Ex: Como lidar com a racionalização?"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-400"
            />
          </div>
        </div>
    </div>
  );
}

interface ApproachPanelProps {
  useCustomApproach: boolean;
  setUseCustomApproach: (v: boolean) => void;
  customApproach: string;
  setCustomApproach: (v: string) => void;
  mainApproach: string | undefined;
}

function ApproachPanel({
  useCustomApproach, setUseCustomApproach,
  customApproach, setCustomApproach,
  mainApproach,
}: ApproachPanelProps) {
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const selectedApproach = APPROACH_OPTIONS.find(option => option.value === customApproach);

  const handleToggleCustom = (checked: boolean) => {
    setUseCustomApproach(checked);
    if (checked && !customApproach) {
      setCustomApproach(mainApproach || APPROACH_OPTIONS[0].value);
    }
  };

  return (
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
            onChange={e => handleToggleCustom(e.target.checked)}
            className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-xs font-semibold text-blue-600">Mudar</span>
        </label>
      </div>
      <div className="mt-2">
        {!useCustomApproach ? (
          <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 p-2.5 text-xs font-medium text-blue-700">
            <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Padrão: {mainApproach || 'Não definida'}</span>
          </div>
        ) : (
          <div
            className="relative"
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                setIsSelectorOpen(false);
              }
            }}
          >
            <button
              type="button"
              onClick={() => setIsSelectorOpen(open => !open)}
              className={`flex w-full items-center justify-between rounded-xl border bg-white px-3 py-2.5 text-left transition-all ${
                isSelectorOpen
                  ? 'border-blue-300 shadow-[0_0_0_3px_rgba(37,99,235,0.10)]'
                  : 'border-slate-200 hover:border-blue-200 hover:bg-blue-50/30'
              }`}
              aria-haspopup="listbox"
              aria-expanded={isSelectorOpen}
            >
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold text-slate-800">
                  {selectedApproach?.label || 'Escolha uma abordagem'}
                </span>
                <span className="mt-0.5 block truncate text-[10px] text-slate-400">
                  {selectedApproach?.description || 'Selecione o referencial para esta análise'}
                </span>
              </span>
              <ChevronDown className={`ml-3 h-4 w-4 shrink-0 text-slate-400 transition-transform ${isSelectorOpen ? 'rotate-180 text-blue-600' : ''}`} />
            </button>

            {isSelectorOpen && (
              <div
                role="listbox"
                className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_18px_45px_rgba(15,23,42,0.14)]"
              >
                {APPROACH_OPTIONS.map((option) => {
                  const selected = customApproach === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        setCustomApproach(option.value);
                        setIsSelectorOpen(false);
                      }}
                      className={`flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors ${
                        selected
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                        selected ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-200 bg-white text-transparent'
                      }`}>
                        <Check className="h-2.5 w-2.5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold leading-tight">{option.label}</span>
                        <span className={`mt-0.5 block text-[10px] leading-snug ${
                          selected ? 'text-blue-500' : 'text-slate-400'
                        }`}>
                          {option.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════ main page ════════════════════ */

export default function NovaAnalise() {
  const { user, cases, addCase, updateCase, setAnalysesUsed } = useApp();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>('standard');

  /* shared config */
  const [sessionsCount, setSessionsCount]   = useState('1-5');
  const [currentDiagnosis, setCurrentDiagnosis] = useState('');
  const [alreadyTried, setAlreadyTried]     = useState('');
  const [specificQuestion, setSpecificQuestion] = useState('');
  const [customApproach, setCustomApproach] = useState('');
  const [useCustomApproach, setUseCustomApproach] = useState(false);

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

  useEffect(() => {
    if (user && !useCustomApproach) setCustomApproach(user.mainApproach);
  }, [user, useCustomApproach]);

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
        await addCase(title, inputText, approach, clinicalContext, analysis, { incrementUsage: false });
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
    `PsiCoach AI — Análise\nAbordagem: ${useCustomApproach ? customApproach : user?.mainApproach}\n\nHIPÓTESE\n${result.hypothesis}\n\nABORDAGENS\n${result.approaches.map((a, i) => `${i + 1}. ${a}`).join('\n')}\n\nPERGUNTAS\n${result.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\nREFERÊNCIAS\n${result.references.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\nPONTO CEGO\n${result.blind_spot}\n\nALERTAS\n${result.alerts.map(a => `- ${a}`).join('\n')}`;

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
      if (!headers) return;

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
      }
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
    setIsTranscribing(true);
    try {
      const headers = await getAuthHeaders();
      if (!headers) return;
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

    const approach = useCustomApproach ? customApproach : user?.mainApproach || '';
    const clinicalContext = {
      sessions_count: sessionsCount,
      current_diagnosis: currentDiagnosis,
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
        await addCase('Análise por áudio', audioTranscript, approach, clinicalContext, data.analysis as CaseAnalysis, { incrementUsage: false });
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
        </div>
      </div>

      {/* ══════════════ STANDARD MODE ══════════════ */}
      {mode === 'standard' && (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[2fr_4fr]">

          {/* ── Coluna esquerda — Entrada do caso ── */}
          <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm lg:p-5">
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
                  rows={3}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Insira queixas do paciente, verbalizações importantes, comportamento observado, histórico relevante..."
                  className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                {inputText.length > 0 && inputText.length < 200 && (
                  <p className="text-[10px] text-amber-600">Recomendado mínimo de 200 caracteres para análise mais precisa.</p>
                )}
              </div>

              <ContextPanel

                sessionsCount={sessionsCount} setSessionsCount={setSessionsCount}
                currentDiagnosis={currentDiagnosis} setCurrentDiagnosis={setCurrentDiagnosis}
                alreadyTried={alreadyTried} setAlreadyTried={setAlreadyTried}
                specificQuestion={specificQuestion} setSpecificQuestion={setSpecificQuestion}
              />
              <ApproachPanel
                useCustomApproach={useCustomApproach} setUseCustomApproach={setUseCustomApproach}
                customApproach={customApproach} setCustomApproach={setCustomApproach}
                mainApproach={user?.mainApproach}
              />

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
          <div className="flex h-full flex-col xl:sticky xl:top-6">
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
                  <p className="mt-2 text-[11px] text-slate-500">Tente novamente em instantes.</p>
                )}
              </div>

            ) : !isAnalyzing && !analysisResult ? (
              <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_12px_28px_rgba(37,99,235,0.28)]">
                  <Brain className="h-7 w-7" />
                </div>
                <h3 className="text-base font-semibold text-slate-800">Dossiê vazio</h3>
                <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-slate-500">
                  Digite o relato e clique em <strong className="text-slate-700">Gerar análise</strong>. O copiloto formulará a hipótese e indicará eixos terapêuticos.
                </p>
              </div>

            ) : isAnalyzing ? (
              <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm">
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

      {/* ══════════════ AUDIO MODE ══════════════ */}
      {mode === 'audio' && (
        <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-[3fr_4fr]">

          {/* ── Coluna esquerda — Gravação ── */}
          <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm lg:p-5">
            <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Mic className="h-3.5 w-3.5" />
              </div>
              <h2 className="text-[13px] font-semibold text-slate-800">Entrada por áudio</h2>
            </div>

            <div className="space-y-4">
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

              <ApproachPanel
                useCustomApproach={useCustomApproach} setUseCustomApproach={setUseCustomApproach}
                customApproach={customApproach} setCustomApproach={setCustomApproach}
                mainApproach={user?.mainApproach}
              />

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

          {/* ── Coluna direita — Resultado ── */}
          <div className="xl:sticky xl:top-6">
            {audioError ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-rose-200 bg-rose-50/40 p-8 text-center">
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
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_12px_28px_rgba(37,99,235,0.28)]">
                  <Mic className="h-7 w-7" />
                </div>
                <h3 className="text-base font-semibold text-slate-800">Grave o relato clínico</h3>
                <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-slate-500">
                  Clique no botão de microfone, descreva o caso em voz alta e depois clique em <strong className="text-slate-700">Gerar análise</strong>.
                </p>
              </div>
            ) : isAudioAnalyzing ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm">
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
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
