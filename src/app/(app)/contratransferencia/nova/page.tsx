'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase/client';
import {
  ArrowLeft,
  Activity,
  Eye,
  Target,
  MessageSquare,
  BookOpen,
  AlertTriangle,
  Loader2,
  FolderHeart,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface CtResult {
  padrao_identificado: string;
  impacto_no_caso: string;
  o_que_observar: string[];
  pergunta_reflexiva: string;
  nivel_processo: 'leve' | 'atencao' | 'significativo';
  referencia: string;
}

const nivelConfig = {
  leve: {
    label: 'Processo Leve',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    dot: 'bg-emerald-400',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    bar: 'bg-emerald-400',
  },
  atencao: {
    label: 'Requer Atenção',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    dot: 'bg-amber-400',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    bar: 'bg-amber-400',
  },
  significativo: {
    label: 'Processo Significativo',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700',
    dot: 'bg-rose-400',
    badge: 'bg-rose-100 text-rose-700 border-rose-200',
    bar: 'bg-rose-400',
  },
};

const steps = [
  {
    key: 'sentimento_durante',
    num: '01',
    label: 'Durante a sessão',
    question: 'Como você se sentiu durante a sessão?',
    placeholder: 'Ex: Me senti impaciente, queria que acabasse logo…',
    hint: 'Raiva, tédio, ansiedade, ternura, distância — tudo é dado válido.',
  },
  {
    key: 'momento_dificil',
    num: '02',
    label: 'Momento crítico',
    question: 'Houve algum momento que te travou ou incomodou?',
    placeholder: 'Ex: Quando ele falou do pai, mudei de assunto sem perceber…',
    hint: 'Silêncios, mudanças de tema, impulsos de dar conselhos — observe.',
  },
  {
    key: 'sentimento_apos',
    num: '03',
    label: 'Após a sessão',
    question: 'Como você saiu emocionalmente?',
    placeholder: 'Ex: Com sensação de que não fiz o suficiente…',
    hint: 'O que ficou ressoando em você depois que o paciente foi embora?',
  },
];

const optionals = [
  {
    key: 'tema_evitado',
    question: 'Teve algum tema que você evitou aprofundar?',
    placeholder: 'Ex: Não aprofundei o tema do relacionamento com a mãe…',
  },
  {
    key: 'percepcao_paciente',
    question: 'O que você acha que o paciente sente em relação a você?',
    placeholder: 'Ex: Acho que ele me idealiza e tem medo de me decepcionar…',
  },
  {
    key: 'observacoes_livres',
    question: 'Algo mais que queira registrar sobre essa sessão?',
    placeholder: 'Qualquer outra percepção, dúvida ou anotação livre…',
  },
];

const emptyForm = {
  sentimento_durante: '',
  momento_dificil: '',
  sentimento_apos: '',
  tema_evitado: '',
  percepcao_paciente: '',
  observacoes_livres: '',
};

function buildCaseSummary(c: { input_text: string; analysis: Record<string, unknown> }) {
  const a = c.analysis as { hypothesis?: string; approaches?: string[]; blind_spot?: string; alerts?: string[] };
  const parts = [
    `Relato: ${c.input_text}`,
    `Hipótese clínica: ${a.hypothesis || ''}`,
    `Intervenções: ${(a.approaches || []).join('; ')}`,
    `Ponto cego: ${a.blind_spot || ''}`,
  ];
  if (a.alerts?.length) parts.push(`Alertas: ${a.alerts.join('; ')}`);
  return parts.join('\n');
}

function NovaContratransferenciaInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { cases } = useApp();

  const caseId = searchParams.get('case_id');
  const selectedCase = cases.find((c) => c.id === caseId) ?? null;

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CtResult | null>(null);
  const [showOptionals, setShowOptionals] = useState(false);

  if (!selectedCase) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
          <Activity className="w-5 h-5 text-slate-400" />
        </div>
        <p className="text-sm font-semibold text-slate-700">Caso não encontrado</p>
        <p className="text-xs text-slate-400">Selecione um caso para analisar a contratransferência.</p>
        <Link href="/contratransferencia" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.sentimento_durante.trim() || !form.momento_dificil.trim() || !form.sentimento_apos.trim()) {
      setError('Preencha os três campos obrigatórios para continuar.');
      return;
    }
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
          case_id: selectedCase.id,
          case_summary: buildCaseSummary(selectedCase as unknown as { input_text: string; analysis: Record<string, unknown> }),
          ...form,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao analisar.');
      setResult(data.resultado);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado.');
    } finally {
      setSubmitting(false);
    }
  };

  const nivel = result ? (nivelConfig[result.nivel_processo] ?? nivelConfig.leve) : null;

  /* ─── RESULT VIEW ─── */
  if (result && nivel) {
    return (
      <div className="max-w-2xl mx-auto space-y-5 pb-10">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar
        </button>

        {/* Result hero */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className={`h-1.5 w-full ${nivel.bar}`} />
          <div className="p-6 flex items-center gap-4 border-b border-slate-100">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${nivel.bg} border ${nivel.border}`}>
              <CheckCircle2 className={`w-5 h-5 ${nivel.text}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${nivel.badge}`}>
                  {nivel.label}
                </span>
                <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 font-medium">
                  {selectedCase.approach_used}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-800 mt-1 truncate">{selectedCase.title}</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Padrão + Impacto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Eye className="w-3 h-3 text-blue-500" /> Padrão identificado
                </p>
                <p className="text-sm leading-relaxed text-slate-700 p-4 bg-slate-50 rounded-2xl border border-slate-100 h-full">
                  {result.padrao_identificado}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Target className="w-3 h-3 text-blue-500" /> Impacto no caso
                </p>
                <p className="text-sm leading-relaxed text-slate-700 p-4 bg-slate-50 rounded-2xl border border-slate-100 h-full">
                  {result.impacto_no_caso}
                </p>
              </div>
            </div>

            {/* O que observar */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <AlertTriangle className={`w-3 h-3 ${nivel.text}`} /> O que observar na próxima sessão
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {result.o_que_observar.map((item, idx) => (
                  <div key={idx} className="flex gap-3 p-3.5 bg-amber-50 border border-amber-100 rounded-2xl">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-white flex items-center justify-center font-bold shrink-0 text-[10px] mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-xs leading-relaxed text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pergunta reflexiva */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3 text-blue-500" /> Pergunta reflexiva
              </p>
              <p
                className="text-sm leading-relaxed text-slate-600 p-5 bg-blue-50/60 border border-blue-100 border-l-4 border-l-blue-500 rounded-2xl italic"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                &ldquo;{result.pergunta_reflexiva}&rdquo;
              </p>
            </div>

            {/* Referência */}
            <div className="flex items-start gap-3 pt-2 border-t border-slate-100">
              <BookOpen className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-500 leading-relaxed flex-1">{result.referencia}</p>
              <Link
                href={`/historico/${selectedCase.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-500 hover:text-blue-700 rounded-xl text-xs font-semibold transition-all shrink-0"
              >
                <FolderHeart className="w-3 h-3" /> Ver caso <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Footer actions */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex gap-3">
            <Link
              href="/contratransferencia"
              className="flex-1 text-center px-4 py-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-colors"
            >
              Ver todas
            </Link>
            <button
              onClick={() => { setResult(null); setForm(emptyForm); setShowOptionals(false); }}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all shadow-[0_6px_16px_rgba(37,99,235,0.25)] hover:-translate-y-0.5"
            >
              Nova análise
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─── FORM VIEW ─── */
  const filledCount = [form.sentimento_durante, form.momento_dificil, form.sentimento_apos].filter(v => v.trim()).length;

  return (
    <div className="max-w-2xl mx-auto pb-12 space-y-4">

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <Link href="/contratransferencia" className="text-blue-600 font-semibold uppercase tracking-widest hover:underline">
            Contratransferência
          </Link>
          <span>/</span>
          <span className="truncate max-w-xs text-slate-500">{selectedCase.title}</span>
        </div>
      </div>

      {/* ── Hero ── */}
      <div className="surface-card p-7 flex flex-col gap-5 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-blue-100/60 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-16 w-24 h-24 rounded-full bg-violet-100/40 blur-2xl pointer-events-none" />

        <div className="flex items-start gap-4 relative">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0 shadow-[0_8px_20px_rgba(37,99,235,0.28)]">
            <Activity className="w-5.5 h-5.5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Análise de Contratransferência</p>
            <h1 className="text-lg font-semibold text-slate-900 mt-0.5 truncate">{selectedCase.title}</h1>
            <p className="text-xs text-slate-400 mt-0.5">{selectedCase.approach_used}</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed relative">
          Suas reações emocionais durante a sessão são dados clínicos tão valiosos quanto o relato do paciente.{' '}
          <span className="text-slate-800 font-medium">Reflita com honestidade — sem julgamento.</span>
        </p>

        {/* Progress bar */}
        <div className="relative">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Progresso</span>
            <span className="text-[10px] font-semibold text-slate-600">{filledCount} / 3 obrigatórios</span>
          </div>
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${(filledCount / 3) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Form ── */}
      <form onSubmit={handleSubmit} className="space-y-3">

        {error && (
          <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl px-4 py-3 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </div>
        )}

        {/* Required steps — vertical timeline */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-5 rounded-full bg-blue-600" />
              <p className="text-xs font-semibold text-slate-800">Reflexão obrigatória</p>
            </div>
            <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-100 rounded-lg px-2 py-0.5 font-medium">
              3 campos
            </span>
          </div>

          <div className="relative">
            {steps.map(({ key, num, label, question, placeholder, hint }, idx) => {
              const value = form[key as keyof typeof form];
              const isFilled = value.trim().length > 0;
              return (
                <div key={key} className={`relative flex gap-0 ${idx !== steps.length - 1 ? 'border-b border-slate-50' : ''}`}>
                  {/* Step indicator */}
                  <div className="flex flex-col items-center pt-5 pl-6 pr-4 shrink-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all shrink-0 ${
                      isFilled
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-slate-200 text-slate-400'
                    }`}>
                      {isFilled ? <CheckCircle2 className="w-3.5 h-3.5" /> : num}
                    </div>
                    {idx !== steps.length - 1 && (
                      <div className={`w-px flex-1 mt-2 mb-0 min-h-[32px] transition-colors ${isFilled ? 'bg-blue-200' : 'bg-slate-100'}`} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 py-5 pr-6 space-y-2">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
                      <label className="block text-xs font-semibold text-slate-800 mt-0.5">
                        {question} <span className="text-rose-400">*</span>
                      </label>
                      {hint && <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{hint}</p>}
                    </div>
                    <textarea
                      value={value}
                      onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      rows={3}
                      className={`w-full border rounded-xl p-3 text-xs text-slate-700 placeholder-slate-400 outline-none transition-all resize-none leading-relaxed ${
                        isFilled
                          ? 'bg-blue-50/40 border-blue-200 focus:border-blue-400 focus:bg-white'
                          : 'bg-slate-50 border-slate-200 focus:border-blue-400 focus:bg-white'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Optional fields — collapsible */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setShowOptionals(v => !v)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-5 rounded-full bg-slate-200" />
              <p className="text-xs font-semibold text-slate-700">Campos opcionais</p>
              <span className="text-[10px] text-slate-400 font-normal">— enriquecem a análise</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-200 ${showOptionals ? 'rotate-180' : ''}`} />
          </button>

          {showOptionals && (
            <div className="border-t border-slate-50 divide-y divide-slate-50">
              {optionals.map(({ key, question, placeholder }) => (
                <div key={key} className="p-5 space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    {question}
                    <span className="text-[10px] font-normal text-slate-400 ml-1">(opcional)</span>
                  </label>
                  <textarea
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-400 focus:bg-white rounded-xl p-3 text-xs text-slate-700 placeholder-slate-400 outline-none transition-all resize-none leading-relaxed"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-3.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-2xl text-sm font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting || filledCount < 3}
            className="px-4 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl text-sm font-semibold transition-all shadow-[0_8px_24px_rgba(37,99,235,0.28)] hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analisando…</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analisar contratransferência</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NovaContratransferenciaPage() {
  return (
    <Suspense>
      <NovaContratransferenciaInner />
    </Suspense>
  );
}
