'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { ArrowRight, ArrowLeft, Award, Sparkles, AlertCircle } from 'lucide-react';

const APPROACHES = [
  {
    name: 'TCC (Terapia Cognitivo-Comportamental)',
    desc: 'Foco na flexibilização de pensamentos disfuncionais, crenças intermediárias e experimentos comportamentais.'
  },
  {
    name: 'Psicanálise',
    desc: 'Formulações focadas no inconsciente, repressão edípica, Superego severo, transferência e livre associação.'
  },
  {
    name: 'Gestalt-terapia',
    desc: 'Intervenções baseadas na autorregulação organísmica, contato do self e atenção plena ao aqui-e-agora.'
  },
  {
    name: 'Sistêmica / Terapia Familiar',
    desc: 'Mapeamento circular interativo do clã familiar, genograma e triangulação de conflitos.'
  },
  {
    name: 'Humanista / Fenomenologia',
    desc: 'Foco na empatia incondicional, congruência terapêutica e autoatualização organísmica do eu.'
  },
  {
    name: 'Junguiana / Psicologia Analítica',
    desc: 'Análise de símbolos, arquétipos do inconsciente coletivo, sombra pessoal e individuação.'
  }
];

export default function OnboardingAbordagem() {
  const { user, setUser } = useApp();
  const router = useRouter();

  const [selectedApproach, setSelectedApproach] = useState('TCC (Terapia Cognitivo-Comportamental)');
  const [description, setDescription]           = useState('');
  const [saving, setSaving]                     = useState(false);
  const [saveError, setSaveError]               = useState<string | null>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (user.mainApproach)          setSelectedApproach(user.mainApproach);
    if (user.approachDescription)   setDescription(user.approachDescription);
  }, [user, router]);

  if (!user) return null;

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);

    try {
      await setUser({
        ...user,
        mainApproach: selectedApproach,
        approachDescription: description,
      });
      router.push('/onboarding/tour');
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : 'Não foi possível salvar. Verifique sua conexão e tente novamente.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#FAFBFD] text-slate-900 min-h-screen flex items-center justify-center p-5 font-sans">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-100 shadow-sm p-8 lg:p-10 space-y-7">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            <span>Passo 2 de 3 · Linha Teórica</span>
            <span className="text-blue-600">66%</span>
          </div>
          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className="w-2/3 h-full bg-blue-600 rounded-full transition-all duration-300" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="page-headline">
            Sua linha <span className="page-headline-accent">teórica.</span>
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed max-w-lg">
            As análises do copiloto se adequarão aos teóricos e ao vocabulário técnico da abordagem escolhida.
          </p>
        </div>

        {saveError && (
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <p className="text-sm text-rose-700">{saveError}</p>
          </div>
        )}

        <form onSubmit={handleNext} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
            {APPROACHES.map(ap => {
              const isSelected = selectedApproach === ap.name;
              return (
                <button
                  key={ap.name}
                  type="button"
                  onClick={() => setSelectedApproach(ap.name)}
                  className={`p-4 rounded-2xl border text-left flex flex-col gap-2 transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/60 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Award className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                    <h4 className="text-[13px] font-semibold text-slate-800">{ap.name}</h4>
                  </div>
                  <p className="text-[11.5px] leading-relaxed text-slate-500">{ap.desc}</p>
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Nuances ou autores preferidos (opcional)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Psicanálise lacaniana, ou TCC com foco em ACT..."
              rows={3}
              className="w-full bg-white border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-xl p-3.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all resize-none leading-relaxed"
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => router.push('/onboarding/perfil')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-5 py-3.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-semibold transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex-[2] inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all shadow-[0_12px_28px_rgba(37,99,235,0.28)] hover:-translate-y-0.5 disabled:translate-y-0 disabled:shadow-none"
            >
              {saving ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Salvando...</>
              ) : (
                <><span>Prosseguir para Tour</span><ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
