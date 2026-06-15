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
  Heart,
  Brain,
  Sunrise,
  EyeOff,
  Users,
  PenLine,
  CheckCircle2,
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
    headerBg: 'bg-emerald-50 border-emerald-100',
  },
  atencao: {
    label: 'Requer Atenção',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    dot: 'bg-amber-400',
    headerBg: 'bg-amber-50 border-amber-100',
  },
  significativo: {
    label: 'Processo Significativo',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700',
    dot: 'bg-rose-400',
    headerBg: 'bg-rose-50 border-rose-100',
  },
};

const emptyForm = {
  sentimento_durante: '',
  momento_dificil: '',
  sentimento_apos: '',
  tema_evitado: '',
  percepcao_paciente: '',
  observacoes_livres: '',
};

const requiredFields = [
  {
    key: 'sentimento_durante',
    label: 'Durante a sessão',
    question: 'Como você se sentiu durante a sessão?',
    placeholder: 'Ex: Me senti impaciente, queria que acabasse logo…',
    icon: Heart,
    color: 'text-rose-400',
  },
  {
    key: 'momento_dificil',
    label: 'Momento crítico',
    question: 'Teve algum momento que te travou ou incomodou?',
    placeholder: 'Ex: Quando ele falou do pai, mudei de assunto sem perceber…',
    icon: Brain,
    color: 'text-violet-400',
  },
  {
    key: 'sentimento_apos',
    label: 'Após a sessão',
    question: 'Como você saiu da sessão emocionalmente?',
    placeholder: 'Ex: Com sensação de que não fiz o suficiente…',
    icon: Sunrise,
    color: 'text-amber-400',
  },
];

const optionalFields = [
  {
    key: 'tema_evitado',
    label: 'Tema evitado',
    question: 'Teve algum tema que você evitou aprofundar?',
    placeholder: 'Ex: Não aprofundei o tema do relacionamento com a mãe…',
    icon: EyeOff,
    color: 'text-slate-400',
  },
  {
    key: 'percepcao_paciente',
    label: 'Percepção do paciente',
    question: 'O que você acha que o paciente sente em relação a você?',
    placeholder: 'Ex: Acho que ele me idealiza e tem medo de me decepcionar…',
    icon: Users,
    color: 'text-blue-400',
  },
  {
    key: 'observacoes_livres',
    label: 'Observações livres',
    question: 'Algo mais que queira registrar sobre essa sessão?',
    placeholder: 'Qualquer outra percepção, dúvida ou anotação livre…',
    icon: PenLine,
    color: 'text-slate-400',
  },
];

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

  if (!selectedCase) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <p className="text-sm text-slate-500">Caso não encontrado.</p>
        <Link href="/contratransferencia" className="text-sm font-semibold text-blue-600 hover:underline">
          ← Voltar
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.sentimento_durante.trim() || !form.momento_dificil.trim() || !form.sentimento_apos.trim()) {
      setError('Preencha os três campos obrigatórios.');
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

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* ── Breadcrumb + back ── */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <Activity className="w-3 h-3 text-blue-500" />
          <span className="text-blue-600 font-semibold uppercase tracking-widest">Contratransferência</span>
          <span>/</span>
          <span className="truncate max-w-xs">{selectedCase.title}</span>
        </div>
      </div>

      {/* ── Result ── */}
      {result && nivel && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Result header */}
          <div className={`p-6 border-b ${nivel.headerBg} flex items-center gap-4`}>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${nivel.bg} border ${nivel.border}`}>
              <CheckCircle2 className={`w-5 h-5 ${nivel.text}`} />
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-widest ${nivel.text}`}>{nivel.label}</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">{selectedCase.title}</p>
            </div>
            <span className="ml-auto text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded-lg px-2 py-1">
              {selectedCase.approach_used}
            </span>
          </div>

          <div className="p-6 space-y-6">
            {/* Padrão + Impacto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Eye className="w-3 h-3 text-blue-500" /> Padrão identificado
                </p>
                <p className="text-sm leading-relaxed text-slate-700 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  {result.padrao_identificado}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Target className="w-3 h-3 text-blue-500" /> Impacto no caso
                </p>
                <p className="text-sm leading-relaxed text-slate-700 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  {result.impacto_no_caso}
                </p>
              </div>
            </div>

            {/* O que observar */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <AlertTriangle className={`w-3 h-3 ${nivel.text}`} /> O que observar
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {result.o_que_observar.map((item, idx) => (
                  <div key={idx} className="flex gap-3 p-3.5 bg-amber-50 border border-amber-100 rounded-2xl text-sm text-slate-700">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-white flex items-center justify-center font-bold shrink-0 text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed text-xs">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pergunta reflexiva */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3 text-blue-500" /> Pergunta reflexiva
              </p>
              <p className="text-sm leading-relaxed text-slate-600 p-5 bg-blue-50/70 border border-blue-100 border-l-4 border-l-blue-500 rounded-2xl italic" style={{ fontFamily: 'Georgia, serif' }}>
                &ldquo;{result.pergunta_reflexiva}&rdquo;
              </p>
            </div>

            {/* Referência + ações */}
            <div className="flex items-start justify-between gap-4 pt-2 border-t border-slate-100">
              <div className="flex gap-2 items-start flex-1">
                <BookOpen className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <p className="text-xs text-slate-500 leading-relaxed">{result.referencia}</p>
              </div>
              <Link
                href={`/historico/${selectedCase.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-500 hover:text-blue-700 rounded-xl text-xs font-semibold transition-all shrink-0"
              >
                <FolderHeart className="w-3 h-3" />
                Ver caso
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex gap-3">
            <Link
              href="/contratransferencia"
              className="flex-1 text-center px-4 py-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-colors"
            >
              Ver todas as análises
            </Link>
            <button
              onClick={() => { setResult(null); setForm(emptyForm); }}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all shadow-[0_6px_16px_rgba(37,99,235,0.25)] hover:-translate-y-0.5"
            >
              Nova análise
            </button>
          </div>
        </div>
      )}

      {/* ── Form ── */}
      {!result && (
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Hero card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0 shadow-[0_8px_20px_rgba(37,99,235,0.25)]">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-widest">Como você se sentiu?</p>
              <h1 className="text-base font-semibold text-slate-900 truncate">{selectedCase.title}</h1>
              <p className="text-xs text-slate-400 mt-0.5">Suas reações são dados clínicos valiosos.</p>
            </div>
          </div>

          {error && (
            <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl px-4 py-3">
              {error}
            </div>
          )}

          {/* Required fields */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-blue-600" />
              <p className="text-xs font-semibold text-slate-700">Campos obrigatórios</p>
            </div>
            <div className="divide-y divide-slate-50">
              {requiredFields.map(({ key, question, placeholder, icon: Icon, color }) => (
                <div key={key} className="p-5 space-y-2.5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <Icon className={`w-3.5 h-3.5 ${color} shrink-0`} />
                    {question}
                    <span className="text-rose-400 ml-0.5">*</span>
                  </label>
                  <textarea
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-400 focus:bg-white rounded-xl p-3.5 text-sm text-slate-700 placeholder-slate-400 outline-none transition-all resize-none leading-relaxed"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Optional fields */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-slate-300" />
              <p className="text-xs font-semibold text-slate-700">Campos opcionais</p>
              <span className="text-[10px] text-slate-400 ml-1">— enriquecem a análise</span>
            </div>
            <div className="divide-y divide-slate-50">
              {optionalFields.map(({ key, question, placeholder, icon: Icon, color }) => (
                <div key={key} className="p-5 space-y-2.5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <Icon className={`w-3.5 h-3.5 ${color} shrink-0`} />
                    {question}
                    <span className="text-[10px] font-normal text-slate-400">(opcional)</span>
                  </label>
                  <textarea
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-400 focus:bg-white rounded-xl p-3.5 text-sm text-slate-700 placeholder-slate-400 outline-none transition-all resize-none leading-relaxed"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pb-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-4 py-3.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-2xl text-sm font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-2xl text-sm font-semibold transition-all shadow-[0_8px_24px_rgba(37,99,235,0.3)] hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analisando…</span>
                </>
              ) : (
                'Analisar contratransferência'
              )}
            </button>
          </div>
        </form>
      )}
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
