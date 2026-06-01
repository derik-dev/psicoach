'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  Brain, ArrowRight, ArrowLeft, Layers, ShieldCheck, Zap, AlertCircle,
} from 'lucide-react';

export default function OnboardingTour() {
  const { user, setUser } = useApp();
  const router = useRouter();

  const [slide, setSlide]       = useState(0);
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!user) router.push('/login');
  }, [user, router]);

  if (!user) return null;

  const slides = [
    {
      title: 'Como funciona a Análise Clínica?',
      desc: 'Você descreve o relato do caso, falas emblemáticas e sintomas. A IA cruza tudo isso com a literatura e a sua abordagem teórica preferida.',
      icon: Brain,
      badge: 'Passo 1 · Descrever',
    },
    {
      title: 'Consulte intervenções e referências',
      desc: 'A resposta vem estruturada: hipótese diagnóstica, sugestões práticas, perguntas para a sessão e embasamento bibliográfico.',
      icon: Layers,
      badge: 'Passo 2 · Revisar',
    },
    {
      title: 'Aprofunde em chat livre sobre o caso',
      desc: 'Após a análise, abra um chat contextual contínuo. Detalhe teorias, sugira experimentos ou debata resistências.',
      icon: Zap,
      badge: 'Passo 3 · Aprofundar',
    },
  ];

  const current = slides[slide];
  const Icon = current.icon;

  const handleNext = async () => {
    if (slide < slides.length - 1) {
      setSlide(slide + 1);
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      await setUser({ ...user, onboardingCompleted: true });
      router.push('/nova-analise');
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : 'Não foi possível finalizar o onboarding. Verifique sua conexão e tente novamente.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (slide > 0) setSlide(slide - 1);
    else router.push('/onboarding/abordagem');
  };

  return (
    <div className="bg-[#FAFBFD] text-slate-900 min-h-screen flex items-center justify-center p-5 font-sans">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-100 shadow-sm p-8 lg:p-10 space-y-7">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            <span>Passo 3 de 3 · Tour Guiado</span>
            <span className="text-blue-600">99%</span>
          </div>
          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className="w-full h-full bg-blue-600 rounded-full transition-all duration-300" />
          </div>
        </div>

        <div className="space-y-3 text-center">
          <h1 className="page-headline">
            Um <span className="page-headline-accent">tour</span> rápido.
          </h1>
        </div>

        {saveError && (
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <p className="text-sm text-rose-700">{saveError}</p>
          </div>
        )}

        <div className="p-7 rounded-3xl bg-slate-50 border border-slate-100 text-center min-h-[300px] flex flex-col items-center justify-center space-y-5">
          <span className="section-badge">{current.badge}</span>

          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-[0_12px_28px_rgba(37,99,235,0.28)]">
            <Icon className="w-7 h-7" />
          </div>

          <div className="space-y-2 max-w-md">
            <h3 className="text-base font-semibold text-slate-800">{current.title}</h3>
            <p className="text-[13px] text-slate-500 leading-relaxed">{current.desc}</p>
          </div>

          <div className="flex items-center justify-center gap-1.5 pt-1">
            {slides.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  slide === idx ? 'w-6 bg-blue-600' : 'w-1.5 bg-slate-300'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex gap-3 text-slate-600 text-[12px] leading-relaxed">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <span>
            <strong className="font-semibold text-slate-800">Lembre-se:</strong> nunca digite nomes civis completos, endereços exatos ou dados identificadores dos pacientes. Mantenha o sigilo conforme as diretrizes do CFP.
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-5 py-3.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-600 rounded-xl text-sm font-semibold transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={saving}
            className="flex-[2] inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all shadow-[0_12px_28px_rgba(37,99,235,0.28)] hover:-translate-y-0.5 disabled:translate-y-0 disabled:shadow-none"
          >
            {saving ? (
              <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Salvando...</>
            ) : (
              <><span>{slide === slides.length - 1 ? 'Iniciar Primeira Análise' : 'Próximo Passo'}</span><ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
