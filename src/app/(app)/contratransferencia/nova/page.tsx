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
  Heart,
  Brain,
  Sunrise,
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
    bar: 'bg-emerald-400',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-400',
  },
  atencao: {
    label: 'Requer Atenção',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    bar: 'bg-amber-400',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    dot: 'bg-amber-400',
  },
  significativo: {
    label: 'Processo Significativo',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700',
    bar: 'bg-rose-400',
    badge: 'bg-rose-100 text-rose-700 border-rose-200',
    dot: 'bg-rose-400',
  },
};

const steps = [
  {
    key: 'sentimento_durante',
    num: '01',
    label: 'Durante a sessão',
    icon: Heart,
    iconColor: 'text-rose-400',
    question: 'Como você se sentiu durante a sessão?',
    placeholder: 'Ex: Me senti impaciente, queria que acabasse logo…',
  },
  {
    key: 'momento_dificil',
    num: '02',
    label: 'Momento crítico',
    icon: Brain,
    iconColor: 'text-violet-400',
    question: 'Houve algum momento que te travou ou incomodou?',
    placeholder: 'Ex: Quando ele falou do pai, mudei de assunto sem perceber…',
  },
  {
    key: 'sentimento_apos',
    num: '03',
    label: 'Após a sessão',
    icon: Sunrise,
    iconColor: 'text-amber-400',
    question: 'Como você saiu emocionalmente?',
    placeholder: 'Ex: Com sensação de que não fiz o suficiente…',
  },
];

const optionals = [
  {
    key: 'tema_evitado',
    question: 'Teve algum tema que você evitou aprofundar?',
    placeholder: 'Ex: Não aprofundei o relacionamento com a mãe…',
  },
  {
    key: 'percepcao_paciente',
    question: 'O que você acha que o paciente sente em relação a você?',
    placeholder: 'Ex: Acho que ele me idealiza…',
  },
  {
    key: 'observacoes_livres',
    question: 'Algo mais que queira registrar?',
    placeholder: 'Qualquer outra percepção ou anotação livre…',
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

type FormData = typeof emptyForm;

function buildCaseSummary(input_text: string, analysis: Record<string, unknown>) {
  const a = analysis as { hypothesis?: string; approaches?: string[]; blind_spot?: string; alerts?: string[] };
  const parts = [
    `Relato: ${input_text}`,
    `Hipótese clínica: ${a.hypothesis || ''}`,
    `Intervenções: ${(a.approaches || []).join('; ')}`,
    `Ponto cego: ${a.blind_spot || ''}`,
  ];
  if (a.alerts?.length) parts.push(`Alertas: ${a.alerts.join('; ')}`);
  return parts.join('\n');
}

/* ── Result panel (left column after analysis) ── */
function ResultPanel({ result, nivel }: { result: CtResult; nivel: typeof nivelConfig['leve'] }) {
  return (
    <div className="space-y-4">
      {/* Level badge */}
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${nivel.badge}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${nivel.dot}`} />
        {nivel.label}
      </div>

      {/* Padrão */}
      <div className="space-y-1.5">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Eye className="w-3 h-3 text-blue-500" /> Padrão identificado
        </p>
        <p className="text-sm leading-relaxed text-slate-700 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          {result.padrao_identificado}
        </p>
      </div>

      {/* Impacto */}
      <div className="space-y-1.5">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Target className="w-3 h-3 text-blue-500" /> Impacto no caso
        </p>
        <p className="text-sm leading-relaxed text-slate-700 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          {result.impacto_no_caso}
        </p>
      </div>

      {/* O que observar */}
      <div className="space-y-1.5">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <AlertTriangle className={`w-3 h-3 ${nivel.text}`} /> O que observar
        </p>
        <div className="space-y-2">
          {result.o_que_observar.map((item, idx) => (
            <div key={idx} className="flex gap-2.5 p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <span className="w-4 h-4 rounded-full bg-amber-400 text-white flex items-center justify-center font-bold shrink-0 text-[9px]">
                {idx + 1}
              </span>
              <span className="text-xs leading-relaxed text-slate-700">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pergunta reflexiva */}
      <div className="space-y-1.5">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <MessageSquare className="w-3 h-3 text-blue-500" /> Pergunta reflexiva
        </p>
        <p
          className="text-sm leading-relaxed text-slate-600 p-4 bg-blue-50/60 border border-blue-100 border-l-4 border-l-blue-500 rounded-2xl italic"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          &ldquo;{result.pergunta_reflexiva}&rdquo;
        </p>
      </div>

      {/* Referência */}
      <div className="flex gap-2 items-start pt-1 border-t border-slate-100">
        <BookOpen className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-500 leading-relaxed">{result.referencia}</p>
      </div>
    </div>
  );
}

/* ── Inputs summary (right column after analysis) ── */
function InputsSummary({
  form,
  caseTitle,
  caseId,
  onReset,
}: {
  form: FormData;
  caseTitle: string;
  caseId: string;
  onReset: () => void;
}) {
  const filled = steps.filter(s => form[s.key as keyof FormData].trim());
  const filledOptionals = optionals.filter(o => form[o.key as keyof FormData].trim());

  return (
    <div className="space-y-4">
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Caso analisado</p>
        <p className="text-sm font-semibold text-slate-800">{caseTitle}</p>
      </div>

      <div className="space-y-3">
        {filled.map(({ key, label, icon: Icon, iconColor, question }) => (
          <div key={key} className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Icon className={`w-3 h-3 ${iconColor} shrink-0`} />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mb-0.5">{question}</p>
            <p className="text-xs leading-relaxed text-slate-700 p-3 bg-white border border-slate-100 rounded-xl">
              {form[key as keyof FormData]}
            </p>
          </div>
        ))}
        {filledOptionals.map(({ key, question }) => (
          <div key={key} className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 mb-0.5">{question}</p>
            <p className="text-xs leading-relaxed text-slate-600 p-3 bg-white border border-slate-100 rounded-xl">
              {form[key as keyof FormData]}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
        <Link
          href={`/historico/${caseId}`}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-600 hover:text-blue-700 rounded-xl text-xs font-semibold transition-all"
        >
          <FolderHeart className="w-3.5 h-3.5" /> Ver caso completo <ArrowRight className="w-3 h-3" />
        </Link>
        <button
          onClick={onReset}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-[0_4px_12px_rgba(37,99,235,0.25)] hover:-translate-y-0.5"
        >
          Nova análise
        </button>
        <Link
          href="/contratransferencia"
          className="text-center text-[11px] font-semibold text-slate-400 hover:text-slate-600 transition-colors py-1"
        >
          Ver todas as análises
        </Link>
      </div>
    </div>
  );
}

function NovaContratransferenciaInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { cases } = useApp();

  const caseId = searchParams.get('case_id');
  const selectedCase = cases.find((c) => c.id === caseId) ?? null;

  const [form, setForm] = useState(emptyForm);
  const [submittedForm, setSubmittedForm] = useState<FormData | null>(null);
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
    const snapshot = { ...form };
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
          case_summary: buildCaseSummary(selectedCase.input_text, selectedCase.analysis as unknown as Record<string, unknown>),
          ...form,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao analisar.');
      setSubmittedForm(snapshot);
      setResult(data.resultado);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setSubmittedForm(null);
    setForm(emptyForm);
    setShowOptionals(false);
  };

  const nivel = result ? (nivelConfig[result.nivel_processo] ?? nivelConfig.leve) : null;
  const filledCount = [form.sentimento_durante, form.momento_dificil, form.sentimento_apos].filter(v => v.trim()).length;

  /* ─── Shared breadcrumb ─── */
  const Breadcrumb = () => (
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
  );

  /* ─── RESULT VIEW ─── */
  if (result && nivel && submittedForm) {
    return (
      <div className="pb-12 space-y-4" style={{ maxWidth: '1080px', margin: '0 auto' }}>
        <Breadcrumb />

        {/* Result header */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className={`h-1.5 w-full ${nivel.bar}`} />
          <div className="px-6 py-4 flex items-center gap-3">
            <CheckCircle2 className={`w-5 h-5 ${nivel.text} shrink-0`} />
            <div>
              <p className="text-xs font-semibold text-slate-800">Análise concluída</p>
              <p className="text-[11px] text-slate-400">{selectedCase.title} · {selectedCase.approach_used}</p>
            </div>
          </div>
        </div>

        {/* Split: result (left) + inputs summary (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
          {/* Left: AI result */}
          <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <ResultPanel result={result} nivel={nivel} />
          </div>

          {/* Right: what therapist wrote (sticky) */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-5 lg:sticky lg:top-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Seu relato</p>
            <InputsSummary
              form={submittedForm}
              caseTitle={selectedCase.title}
              caseId={selectedCase.id}
              onReset={handleReset}
            />
          </div>
        </div>
      </div>
    );
  }

  /* ─── FORM VIEW ─── */
  return (
    <div className="pb-12 space-y-4" style={{ maxWidth: '1080px', margin: '0 auto' }}>
      <Breadcrumb />

      {/* Form header */}
      <div className="surface-card p-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0 shadow-[0_8px_20px_rgba(37,99,235,0.28)]">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Reflexão terapêutica</p>
            <h1 className="text-base font-semibold text-slate-900 mt-0.5">{selectedCase.title}</h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Suas reações emocionais são dados clínicos valiosos.</p>
          </div>
        </div>
        {/* Progress dots */}
        <div className="flex items-center gap-1.5 shrink-0">
          {steps.map((_, i) => {
            const filled = form[steps[i].key as keyof typeof form].trim().length > 0;
            return (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${filled ? 'w-5 h-2.5 bg-blue-500' : 'w-2.5 h-2.5 bg-slate-200'}`}
              />
            );
          })}
        </div>
      </div>

      {/* Split: form (right occupies more) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">

        {/* Left: hint + case label only */}
        <div className="lg:col-span-2 space-y-3 lg:sticky lg:top-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Caso</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">{selectedCase.title}</p>
              <span className="inline-block text-[10px] font-medium text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 mt-1.5">
                {selectedCase.approach_used}
              </span>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progresso</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${(filledCount / 3) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-slate-500 shrink-0">{filledCount}/3</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-violet-50 border border-violet-100 rounded-2xl">
            <p className="text-[11px] text-violet-700 leading-relaxed">
              <span className="font-semibold">Lembre-se:</span> não há resposta certa ou errada. Suas reações são informações clínicas — reflita com honestidade.
            </p>
          </div>
        </div>

        {/* Right: form */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl px-4 py-3 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
              </div>
            )}

            {/* Required fields */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              {steps.map(({ key, num, label, icon: Icon, iconColor, question, placeholder }, idx) => {
                const value = form[key as keyof typeof form];
                const isFilled = value.trim().length > 0;
                return (
                  <div
                    key={key}
                    className={`p-5 space-y-3 ${idx !== steps.length - 1 ? 'border-b border-slate-100' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border-2 transition-all ${
                        isFilled
                          ? 'bg-blue-600 border-blue-600 text-white shadow-[0_4px_10px_rgba(37,99,235,0.2)]'
                          : 'bg-white border-slate-200 text-slate-400'
                      }`}>
                        {isFilled
                          ? <CheckCircle2 className="w-4 h-4" />
                          : <span className="text-[10px] font-bold">{num}</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Icon className={`w-3 h-3 ${iconColor} shrink-0`} />
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
                          <span className="text-rose-400 text-xs ml-auto">*</span>
                        </div>
                        <label className="block text-xs font-semibold text-slate-800">{question}</label>
                      </div>
                    </div>
                    <textarea
                      value={value}
                      onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      rows={3}
                      className={`w-full border rounded-xl p-3.5 text-xs text-slate-700 placeholder-slate-400 outline-none transition-all resize-none leading-relaxed ${
                        isFilled
                          ? 'bg-blue-50/30 border-blue-200 focus:border-blue-400 focus:bg-white'
                          : 'bg-slate-50 border-slate-200 focus:border-blue-400 focus:bg-white'
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            {/* Optional fields */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setShowOptionals(v => !v)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-4 rounded-full transition-colors ${showOptionals ? 'bg-blue-400' : 'bg-slate-200'}`} />
                  <p className="text-xs font-semibold text-slate-700">Campos opcionais</p>
                  <span className="text-[10px] text-slate-400">— enriquecem a análise</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-200 ${showOptionals ? 'rotate-180' : ''}`} />
              </button>

              {showOptionals && (
                <div className="border-t border-slate-100 divide-y divide-slate-50">
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
            <div className="grid grid-cols-2 gap-3">
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
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>Analisando…</span></>
                ) : (
                  <><Sparkles className="w-4 h-4" /><span>Analisar contratransferência</span></>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
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
