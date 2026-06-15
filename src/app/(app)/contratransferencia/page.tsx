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
    label: 'Processo leve',
    bar: 'bg-emerald-400',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: 'text-emerald-500',
  },
  atencao: {
    label: 'Atenção ao processo',
    bar: 'bg-amber-400',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: 'text-amber-500',
  },
  significativo: {
    label: 'Processo significativo',
    bar: 'bg-rose-400',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: 'text-rose-500',
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

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div className="surface-card p-7 lg:p-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-4 max-w-2xl">
          <div className="section-badge">
            <Activity className="w-3 h-3 text-blue-600" />
            <span>Processo Terapêutico</span>
          </div>
          <h1 className="page-headline">
            <span className="page-headline-accent">Contra</span>transferência.
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            Identifique como suas reações emocionais influenciam a condução dos seus casos.
          </p>
        </div>
        <button
          onClick={() => { setCaseModal(true); setCaseSearch(''); }}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-all shadow-[0_12px_28px_rgba(37,99,235,0.28)] hover:-translate-y-0.5 self-start shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nova análise</span>
        </button>
      </div>

      {/* ── Loading ── */}
      {(loading || submitting) && (
        <div className="space-y-3">
          {submitting ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              <p className="text-xs text-slate-500 font-medium">Analisando seus processos internos…</p>
            </div>
          ) : (
            [1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-white rounded-2xl border border-slate-100 animate-pulse" />
            ))
          )}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !submitting && analyses.length === 0 && (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-16 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto">
            <Activity className="w-6 h-6 text-blue-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-800">Nenhuma análise ainda</h3>
            <p className="text-xs text-slate-500 leading-normal max-w-xs mx-auto">
              Selecione um caso e registre como se sentiu para receber uma análise supervisionada.
            </p>
          </div>
          <button
            onClick={() => { setCaseModal(true); setCaseSearch(''); }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Começar agora
          </button>
        </div>
      )}

      {/* ── Analyses list ── */}
      {!loading && !submitting && analyses.length > 0 && (
        <div className="space-y-3">
          {analyses.map((a) => {
            const nivel = nivelConfig[a.resultado.nivel_processo] ?? nivelConfig.leve;
            const isOpen = expanded === a.id;

            return (
              <div
                key={a.id}
                className="bg-white rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all overflow-hidden"
              >
                {/* Card row */}
                <button
                  onClick={() => setExpanded(isOpen ? null : a.id)}
                  className="w-full flex items-center gap-0 text-left"
                >
                  {/* Level bar */}
                  <div className={`w-1 self-stretch rounded-l-2xl shrink-0 ${nivel.bar}`} />

                  <div className="flex-1 flex items-center gap-4 p-4 pl-5 min-w-0">
                    {/* Text */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${nivel.badge}`}>
                          {nivel.label}
                        </span>
                        {a.cases && (
                          <span className="text-[10px] font-medium text-slate-400">
                            {a.cases.approach_used}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {a.cases?.title ?? 'Caso sem título'}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-1 leading-relaxed">
                        {a.resultado.padrao_identificado}
                      </p>
                    </div>

                    {/* Right meta */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(a.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t border-slate-100 mx-5 pt-5 pb-5 space-y-5">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Padrão */}
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
                          <Eye className="w-3 h-3 text-blue-500" />
                          Padrão identificado
                        </p>
                        <p className="text-xs leading-relaxed text-slate-700 p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                          {a.resultado.padrao_identificado}
                        </p>
                      </div>

                      {/* Impacto */}
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
                          <Target className="w-3 h-3 text-blue-500" />
                          Impacto no caso
                        </p>
                        <p className="text-xs leading-relaxed text-slate-700 p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                          {a.resultado.impacto_no_caso}
                        </p>
                      </div>
                    </div>

                    {/* O que observar */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
                        <AlertTriangle className={`w-3 h-3 ${nivel.icon}`} />
                        O que observar na próxima sessão
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {a.resultado.o_que_observar.map((item, idx) => (
                          <div key={idx} className="flex gap-2 items-start p-3 bg-amber-50/70 border border-amber-100 rounded-xl text-xs text-slate-700 flex-1 min-w-[200px]">
                            <span className="w-4 h-4 rounded-full bg-amber-400 text-white flex items-center justify-center font-bold shrink-0 text-[9px] mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pergunta + referência */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
                          <MessageSquare className="w-3 h-3 text-blue-500" />
                          Pergunta reflexiva
                        </p>
                        <p className="text-xs leading-relaxed text-slate-600 p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl italic border-l-4 border-l-blue-500" style={{ fontFamily: 'Georgia, serif' }}>
                          &ldquo;{a.resultado.pergunta_reflexiva}&rdquo;
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
                          <BookOpen className="w-3 h-3 text-blue-500" />
                          Referência
                        </p>
                        <p className="text-xs text-slate-600 p-3.5 bg-slate-50 border border-slate-100 rounded-xl leading-relaxed">
                          {a.resultado.referencia}
                        </p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <p className="text-[10px] text-slate-400 italic line-clamp-1 flex-1 mr-4">
                        &ldquo;{a.sentimento_durante}&rdquo;
                      </p>
                      {a.cases && (
                        <Link
                          href={`/historico/${a.case_id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-500 hover:text-blue-700 rounded-xl text-[10px] font-semibold transition-all shrink-0"
                        >
                          <FolderHeart className="w-3 h-3" />
                          <span>Ver caso</span>
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

      {/* ── Case selector modal ── */}
      {caseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col" style={{ maxHeight: 'min(600px, 85vh)' }}>

            {/* Header */}
            <div className="flex items-start justify-between p-6 pb-4 shrink-0">
              <div>
                <h3 className="text-base font-semibold text-slate-800">Selecionar caso</h3>
                <p className="text-xs text-slate-400 mt-0.5">Escolha o caso para analisar a contratransferência</p>
              </div>
              <button
                onClick={() => setCaseModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="px-6 pb-3 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={caseSearch}
                  onChange={(e) => setCaseSearch(e.target.value)}
                  placeholder="Buscar caso..."
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-400 focus:bg-white rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-700 placeholder-slate-400 outline-none transition-all"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-100 mx-6 shrink-0" />

            {/* List */}
            <div className="overflow-y-auto flex-1 p-3">
              {filteredCases.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-10">Nenhum caso encontrado.</p>
              )}
              {filteredCases.map((c) => {
                const abbr = c.approach_used?.split(' ')[0]?.slice(0, 3).toUpperCase() ?? '?';
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCase(c as unknown as typeof selectedCase);
                      setCaseModal(false);
                      setFormModal(true);
                      setFormError('');
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 active:bg-blue-50 transition-colors text-left group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                      {abbr}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-700 transition-colors">
                        {c.title}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {c.approach_used} · {new Date(c.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 shrink-0 transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── CT form modal ── */}
      {formModal && selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col" style={{ maxHeight: 'min(700px, 90vh)' }}>

            {/* Header */}
            <div className="p-6 pb-4 shrink-0 border-b border-slate-100">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-800">Como você se sentiu nessa sessão?</h3>
                  <p className="text-xs text-slate-400">
                    Caso: <span className="font-semibold text-slate-600">{selectedCase.title}</span>
                  </p>
                </div>
                <button
                  onClick={() => setFormModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Form — scrollable */}
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
              <div className="p-6 space-y-4">
                {formError && (
                  <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
                    {formError}
                  </p>
                )}

                {formFields.map(({ key, label, placeholder, required }) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                      {label}
                      {required
                        ? <span className="text-rose-500 ml-0.5">*</span>
                        : <span className="text-[10px] font-normal text-slate-400 ml-1">(opcional)</span>
                      }
                    </label>
                    <textarea
                      value={form[key as keyof typeof form]}
                      onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      rows={required ? 3 : 2}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-400 focus:bg-white rounded-xl p-3 text-xs text-slate-700 placeholder-slate-400 outline-none transition-all resize-none leading-relaxed"
                    />
                  </div>
                ))}
              </div>

              {/* Actions — sticky footer */}
              <div className="flex gap-2 p-6 pt-0 shrink-0">
                <button
                  type="button"
                  onClick={() => setFormModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-[0_6px_16px_rgba(37,99,235,0.25)]"
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
