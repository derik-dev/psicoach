'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  X,
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
    bar: 'bg-emerald-400',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    dot: 'bg-emerald-400',
  },
  atencao: {
    label: 'Atenção',
    bar: 'bg-amber-400',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    dot: 'bg-amber-400',
  },
  significativo: {
    label: 'Significativo',
    bar: 'bg-rose-400',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700',
    dot: 'bg-rose-400',
  },
};

const emptyForm = {
  sentimento_durante: '',
  momento_dificil: '',
  sentimento_apos: '',
  tema_evitado: '',
  percepcao_paciente: '',
};

const formFields = [
  { key: 'sentimento_durante', label: 'Como você se sentiu durante a sessão?', placeholder: 'Ex: Me senti impaciente, queria que acabasse logo…', required: true },
  { key: 'momento_dificil', label: 'Teve algum momento que te travou ou incomodou?', placeholder: 'Ex: Quando ele falou do pai, mudei de assunto sem perceber…', required: true },
  { key: 'sentimento_apos', label: 'Como você saiu da sessão emocionalmente?', placeholder: 'Ex: Com sensação de que não fiz o suficiente…', required: true },
  { key: 'tema_evitado', label: 'Teve algum tema que você evitou aprofundar?', placeholder: 'Ex: Não aprofundei o tema do relacionamento com a mãe…', required: false },
  { key: 'percepcao_paciente', label: 'O que você acha que o paciente sente em relação a você?', placeholder: 'Ex: Acho que ele me idealiza e tem medo de me decepcionar…', required: false },
];

export default function ContratransferenciaPage() {
  const { cases } = useApp();

  const [analyses, setAnalyses] = useState<CtAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [caseModal, setCaseModal] = useState(false);
  const [caseSearch, setCaseSearch] = useState('');
  const [selectedCase, setSelectedCase] = useState<{ id: string; title: string; approach_used: string; input_text: string; analysis: Record<string, unknown> } | null>(null);
  const [formModal, setFormModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const buildCaseSummary = (c: typeof selectedCase) => {
    if (!c) return '';
    const a = c.analysis as { hypothesis?: string; approaches?: string[]; blind_spot?: string; alerts?: string[] };
    const parts = [
      `Relato: ${c.input_text}`,
      `Hipótese clínica: ${a.hypothesis || ''}`,
      `Intervenções: ${(a.approaches || []).join('; ')}`,
      `Ponto cego: ${a.blind_spot || ''}`,
    ];
    if (a.alerts?.length) parts.push(`Alertas: ${a.alerts.join('; ')}`);
    return parts.join('\n');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.sentimento_durante.trim() || !form.momento_dificil.trim() || !form.sentimento_apos.trim()) {
      setFormError('Preencha os três campos obrigatórios.');
      return;
    }
    setFormModal(false);
    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada.');

      const res = await fetch('/api/contratransferencia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          case_id: selectedCase!.id,
          case_summary: buildCaseSummary(selectedCase),
          ...form,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao analisar.');

      const newEntry: CtAnalysis = {
        id: data.id || crypto.randomUUID(),
        case_id: selectedCase!.id,
        created_at: data.created_at || new Date().toISOString(),
        sentimento_durante: form.sentimento_durante,
        resultado: data.resultado,
        cases: { title: selectedCase!.title, approach_used: selectedCase!.approach_used },
      };
      setAnalyses((prev) => [newEntry, ...prev]);
      setExpanded(newEntry.id);
      setForm(emptyForm);
      setSelectedCase(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro inesperado.');
      setFormModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics
  const total = analyses.length;
  const byLevel = {
    leve: analyses.filter(a => a.resultado.nivel_processo === 'leve').length,
    atencao: analyses.filter(a => a.resultado.nivel_processo === 'atencao').length,
    significativo: analyses.filter(a => a.resultado.nivel_processo === 'significativo').length,
  };

  return (
    <div className="space-y-6">

      {/* ── Hero header ── */}
      <div className="surface-card overflow-hidden">
        <div className="p-7 lg:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative">
          {/* decorative blob */}
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-blue-50 opacity-60 blur-3xl pointer-events-none translate-x-1/4 -translate-y-1/4" />

          <div className="space-y-4 max-w-2xl relative">
            <div className="section-badge">
              <Activity className="w-3 h-3 text-blue-600" />
              <span>Processo Terapêutico</span>
            </div>
            <h1 className="page-headline">
              <span className="page-headline-accent">Contra</span>transferência.
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed max-w-lg">
              Suas reações emocionais são dados clínicos. Identifique padrões invisíveis que moldam a condução dos seus casos.
            </p>
          </div>

          <button
            onClick={() => { setCaseModal(true); setCaseSearch(''); }}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-all shadow-[0_12px_28px_rgba(37,99,235,0.28)] hover:-translate-y-0.5 self-start lg:self-center shrink-0 relative"
          >
            <Plus className="w-4 h-4" />
            <span>Nova análise</span>
          </button>
        </div>

        {/* Stats strip — only when there are analyses */}
        {total > 0 && (
          <div className="border-t border-slate-100 grid grid-cols-3 divide-x divide-slate-100">
            {[
              { label: 'Análises', value: total, icon: TrendingUp, color: 'text-blue-600' },
              { label: 'Em atenção', value: byLevel.atencao + byLevel.significativo, icon: AlertTriangle, color: 'text-amber-500' },
              { label: 'Resolvidos', value: byLevel.leve, icon: Zap, color: 'text-emerald-500' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex items-center gap-3 px-6 py-4">
                <Icon className={`w-4 h-4 ${color} shrink-0`} />
                <div>
                  <p className="text-lg font-light text-slate-900 leading-none">{value}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase tracking-wider">{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Loading ── */}
      {(loading || submitting) && (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 flex flex-col items-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          <p className="text-xs text-slate-400 font-medium">
            {submitting ? 'Analisando seus processos internos…' : 'Carregando…'}
          </p>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !submitting && analyses.length === 0 && (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-14 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center mx-auto">
            <Activity className="w-6 h-6 text-blue-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-800">Comece sua primeira análise</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              Selecione um caso clínico, descreva como se sentiu na sessão e receba uma supervisão baseada em evidências.
            </p>
          </div>
          <button
            onClick={() => { setCaseModal(true); setCaseSearch(''); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-[0_8px_20px_rgba(37,99,235,0.22)] hover:-translate-y-0.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Começar agora
          </button>
        </div>
      )}

      {/* ── Analyses list ── */}
      {!loading && !submitting && analyses.length > 0 && (
        <div className="space-y-2">
          {analyses.map((a) => {
            const nivel = nivelConfig[a.resultado.nivel_processo] ?? nivelConfig.leve;
            const isOpen = expanded === a.id;

            return (
              <div key={a.id} className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${isOpen ? 'border-slate-200 shadow-sm' : 'border-slate-100 hover:border-slate-200'}`}>

                {/* Row */}
                <button
                  onClick={() => setExpanded(isOpen ? null : a.id)}
                  className="w-full flex items-center gap-4 p-5 text-left"
                >
                  {/* Level dot */}
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${nivel.dot}`} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${nivel.bg} ${nivel.border} ${nivel.text}`}>
                        {nivel.label}
                      </span>
                      {a.cases && (
                        <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                          {a.cases.approach_used}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {a.cases?.title ?? 'Caso sem título'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                      {a.resultado.padrao_identificado}
                    </p>
                  </div>

                  {/* Date + chevron */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] text-slate-400 hidden sm:flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(a.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Expanded */}
                {isOpen && (
                  <div className="px-5 pb-5 space-y-4 border-t border-slate-100 pt-4">

                    {/* 2-col: padrão + impacto */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Eye className="w-3 h-3 text-blue-500" /> Padrão identificado
                        </p>
                        <p className="text-xs leading-relaxed text-slate-700 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                          {a.resultado.padrao_identificado}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Target className="w-3 h-3 text-blue-500" /> Impacto no caso
                        </p>
                        <p className="text-xs leading-relaxed text-slate-700 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                          {a.resultado.impacto_no_caso}
                        </p>
                      </div>
                    </div>

                    {/* O que observar */}
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

                    {/* Pergunta reflexiva */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3 text-blue-500" /> Pergunta reflexiva
                      </p>
                      <p className="text-xs leading-relaxed text-slate-600 p-4 bg-blue-50/60 border border-blue-100 border-l-4 border-l-blue-500 rounded-xl italic" style={{ fontFamily: 'Georgia, serif' }}>
                        &ldquo;{a.resultado.pergunta_reflexiva}&rdquo;
                      </p>
                    </div>

                    {/* Referência + link */}
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
      )}

      {/* ══════════════════════════════════════
          MODAL — Selecionar caso
      ══════════════════════════════════════ */}
      {caseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80">
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col"
            style={{ maxHeight: 'min(580px, 88vh)' }}
          >
            {/* Header */}
            <div className="p-6 pb-5 shrink-0">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Selecionar caso</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Escolha o caso para analisar a contratransferência</p>
                </div>
                <button
                  onClick={() => setCaseModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search */}
              <div className="relative mt-4">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={caseSearch}
                  onChange={(e) => setCaseSearch(e.target.value)}
                  placeholder="Buscar por título do caso..."
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-400 focus:bg-white rounded-xl pl-10 pr-4 py-3 text-sm text-slate-700 placeholder-slate-400 outline-none transition-all"
                />
              </div>
            </div>

            <div className="h-px bg-slate-100 mx-6 shrink-0" />

            {/* Count */}
            <div className="px-6 py-2 shrink-0">
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                {filteredCases.length} caso{filteredCases.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 px-3 pb-3">
              {filteredCases.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <Search className="w-6 h-6 text-slate-300" />
                  <p className="text-xs text-slate-400">Nenhum caso encontrado.</p>
                </div>
              )}
              {filteredCases.map((c) => {
                const abbr = c.approach_used?.split(' ')[0]?.slice(0, 3).toUpperCase() ?? '?';
                const snippet = c.input_text?.slice(0, 90).trim();
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCase(c as unknown as typeof selectedCase);
                      setCaseModal(false);
                      setFormModal(true);
                      setFormError('');
                    }}
                    className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl hover:bg-slate-50 transition-colors text-left group"
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                      {abbr}
                    </div>

                    {/* Text */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-blue-700 transition-colors">
                        {c.title}
                      </p>
                      {snippet && (
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          {snippet}{(c.input_text?.length ?? 0) > 90 ? '…' : ''}
                        </p>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700">
                        {abbr}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          MODAL — Formulário CT
      ══════════════════════════════════════ */}
      {formModal && selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80">
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col"
            style={{ maxHeight: 'min(700px, 92vh)' }}
          >
            {/* Header */}
            <div className="p-6 pb-5 border-b border-slate-100 shrink-0">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Como você se sentiu?</h2>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                    {selectedCase.title}
                  </p>
                </div>
                <button
                  onClick={() => setFormModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable form */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="overflow-y-auto flex-1 p-6 space-y-5">
                {formError && (
                  <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
                    {formError}
                  </div>
                )}

                {formFields.map(({ key, label, placeholder, required }) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      {label}
                      {required
                        ? <span className="text-rose-500">*</span>
                        : <span className="text-[10px] font-normal text-slate-400 ml-0.5">(opcional)</span>
                      }
                    </label>
                    <textarea
                      value={form[key as keyof typeof form]}
                      onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      rows={required ? 3 : 2}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-400 focus:bg-white rounded-xl p-3.5 text-xs text-slate-700 placeholder-slate-400 outline-none transition-all resize-none leading-relaxed"
                    />
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex gap-3 p-6 pt-4 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setFormModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all shadow-[0_6px_16px_rgba(37,99,235,0.3)] hover:-translate-y-0.5"
                >
                  Analisar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
