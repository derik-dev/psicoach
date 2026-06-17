'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase/client';
import {
  Activity,
  Plus,
  ArrowRight,
  Eye,
  Target,
  MessageSquare,
  BookOpen,
  AlertTriangle,
  Clock,
  FolderHeart,
  Search,
  ChevronDown,
  Loader2,
  TrendingUp,
  Zap,
} from 'lucide-react';

interface CtResult {
  padrao_identificado: string;
  impacto_no_caso: string;
  o_que_observar: string[];
  pergunta_reflexiva: string;
  nivel_processo: 'leve' | 'atencao' | 'significativo';
  referencia: string;
}

interface CtAnalysis {
  id: string;
  case_id: string;
  created_at: string;
  sentimento_durante: string;
  resultado: CtResult;
  cases: { title: string; approach_used: string } | null;
}

const nivelConfig = {
  leve: {
    label: 'Leve',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    dot: 'bg-emerald-400',
  },
  atencao: {
    label: 'Atenção',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    dot: 'bg-amber-400',
  },
  significativo: {
    label: 'Significativo',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700',
    dot: 'bg-rose-400',
  },
};

export default function ContratransferenciaPage() {
  const { cases } = useApp();
  const router = useRouter();

  const [analyses, setAnalyses] = useState<CtAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [caseSearch, setCaseSearch] = useState('');

  useEffect(() => {
    supabase
      .from('contratransference_analyses')
      .select('id, case_id, created_at, sentimento_durante, resultado, cases(title, approach_used)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setAnalyses((data as unknown as CtAnalysis[]) || []);
        setLoading(false);
      });
  }, []);

  const filteredCases = cases.filter((c) =>
    c.title.toLowerCase().includes(caseSearch.toLowerCase())
  );

  const openForm = (c: typeof cases[0]) => {
    router.push(`/contratransferencia/nova?case_id=${c.id}`);
  };

  const total = analyses.length;
  const byLevel = {
    atencao: analyses.filter(a => ['atencao', 'significativo'].includes(a.resultado.nivel_processo)).length,
    leve: analyses.filter(a => a.resultado.nivel_processo === 'leve').length,
  };

  return (
    <div className="space-y-6">

      {/* ── Hero header ── */}
      <div className="surface-card overflow-hidden">
        <div className="p-7 lg:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative">
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-blue-50 opacity-60 blur-3xl pointer-events-none translate-x-1/4 -translate-y-1/4" />
          <div className="space-y-3 max-w-xl relative">
            <div className="section-badge">
              <Activity className="w-3 h-3 text-blue-600" />
              <span>Processo Terapêutico</span>
            </div>
            <h1 className="page-headline">
              <span className="page-headline-accent">Contra</span>transferência.
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              Suas reações emocionais são dados clínicos. Identifique padrões invisíveis que moldam a condução dos seus casos.
            </p>
          </div>
          <Link
            href="/contratransferencia/nova"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-all shadow-[0_8px_20px_rgba(37,99,235,0.25)] hover:-translate-y-0.5 self-start shrink-0 relative"
          >
            <Plus className="w-4 h-4" />
            <span>Nova análise</span>
          </Link>
        </div>

        {total > 0 && (
          <div className="border-t border-slate-100 grid grid-cols-3 divide-x divide-slate-100">
            {[
              { label: 'Análises', value: total, icon: TrendingUp, color: 'text-blue-600' },
              { label: 'Em atenção', value: byLevel.atencao, icon: AlertTriangle, color: 'text-amber-500' },
              { label: 'Processo leve', value: byLevel.leve, icon: Zap, color: 'text-emerald-500' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex items-center gap-3 px-6 py-4">
                <Icon className={`w-4 h-4 ${color} shrink-0`} />
                <div>
                  <p className="text-xl font-light text-slate-900 leading-none">{value}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase tracking-wider">{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Main grid: cases + analyses ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        {/* ── LEFT: Case selector ── */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Selecionar caso</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Clique para analisar a contratransferência</p>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
              {cases.length} caso{cases.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Search */}
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={caseSearch}
                onChange={(e) => setCaseSearch(e.target.value)}
                placeholder="Buscar caso..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-400 focus:bg-white rounded-xl pl-9 pr-3 py-2 text-xs text-slate-700 placeholder-slate-400 outline-none transition-all"
              />
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto" style={{ maxHeight: '420px' }}>
            {cases.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-xs text-slate-400">Nenhum caso disponível.</p>
                <Link href="/nova-analise" className="text-[11px] font-semibold text-blue-600 hover:underline mt-1 inline-block">
                  Criar primeiro caso →
                </Link>
              </div>
            )}
            {filteredCases.length === 0 && cases.length > 0 && (
              <p className="text-xs text-slate-400 text-center py-8">Nenhum caso encontrado.</p>
            )}
            {filteredCases.map((c) => {
              const abbr = c.approach_used?.split(' ')[0]?.slice(0, 3).toUpperCase() ?? '?';
              const snippet = c.input_text?.slice(0, 70).trim();
              return (
                <button
                  key={c.id}
                  onClick={() => openForm(c)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-blue-50 active:bg-blue-100 transition-colors text-left group border-b border-slate-50 last:border-0"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    {abbr}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-700 transition-colors">
                      {c.title}
                    </p>
                    {snippet && (
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                        {snippet}{(c.input_text?.length ?? 0) > 70 ? '…' : ''}
                      </p>
                    )}
                  </div>
                  <Plus className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 shrink-0 transition-colors" />
                </button>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT: Analyses ── */}
        <div className="lg:col-span-3 space-y-3">

          {/* Loading */}
          {loading && (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 flex flex-col items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Carregando…</p>
            </div>
          )}

          {/* Empty */}
          {!loading && analyses.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center space-y-3">
              <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center mx-auto">
                <Activity className="w-5 h-5 text-slate-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Nenhuma análise ainda</p>
                <p className="text-xs text-slate-400 mt-1">Selecione um caso ao lado para começar.</p>
              </div>
            </div>
          )}

          {/* Cards */}
          {!loading && analyses.map((a) => {
            const nivel = nivelConfig[a.resultado.nivel_processo] ?? nivelConfig.leve;
            const isOpen = expanded === a.id;

            return (
              <div key={a.id} className={`bg-white rounded-2xl border transition-all overflow-hidden ${isOpen ? 'border-slate-200 shadow-sm' : 'border-slate-100 hover:border-slate-200'}`}>
                <button
                  onClick={() => setExpanded(isOpen ? null : a.id)}
                  className="w-full flex items-center gap-4 p-4 text-left"
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${nivel.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${nivel.bg} ${nivel.border} ${nivel.text}`}>
                        {nivel.label}
                      </span>
                      {a.cases && (
                        <span className="text-[10px] text-slate-400 hidden sm:inline">{a.cases.approach_used}</span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-800 truncate">{a.cases?.title ?? 'Caso sem título'}</p>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{a.resultado.padrao_identificado}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-slate-400 hidden sm:flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(a.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 space-y-4 border-t border-slate-100 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Eye className="w-3 h-3 text-blue-500" /> Padrão
                        </p>
                        <p className="text-xs leading-relaxed text-slate-700 p-3 bg-slate-50 rounded-xl border border-slate-100">
                          {a.resultado.padrao_identificado}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Target className="w-3 h-3 text-blue-500" /> Impacto
                        </p>
                        <p className="text-xs leading-relaxed text-slate-700 p-3 bg-slate-50 rounded-xl border border-slate-100">
                          {a.resultado.impacto_no_caso}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <AlertTriangle className={`w-3 h-3 ${nivel.text}`} /> O que observar
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {a.resultado.o_que_observar.map((item, idx) => (
                          <div key={idx} className="flex gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-slate-700">
                            <span className="w-4 h-4 rounded-full bg-amber-400 text-white flex items-center justify-center font-bold shrink-0 text-[9px]">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3 text-blue-500" /> Pergunta reflexiva
                      </p>
                      <p className="text-xs leading-relaxed text-slate-600 p-4 bg-blue-50/60 border border-blue-100 border-l-4 border-l-blue-500 rounded-xl italic" style={{ fontFamily: 'Georgia, serif' }}>
                        &ldquo;{a.resultado.pergunta_reflexiva}&rdquo;
                      </p>
                    </div>

                    <div className="flex items-start justify-between gap-4 pt-1 border-t border-slate-100">
                      <div className="flex gap-2 items-start flex-1">
                        <BookOpen className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                        <p className="text-[10px] text-slate-500 leading-relaxed">{a.resultado.referencia}</p>
                      </div>
                      {a.cases && (
                        <Link
                          href={`/historico/${a.case_id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-500 hover:text-blue-700 rounded-xl text-[10px] font-semibold transition-all shrink-0"
                        >
                          <FolderHeart className="w-3 h-3" />
                          Ver caso
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
