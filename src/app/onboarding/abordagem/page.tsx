'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Brain, ArrowRight, ArrowLeft, Award, Sparkles } from 'lucide-react';

const APPROACHES = [
  {
    name: 'TCC (Terapia Cognitivo-Comportamental)',
    desc: 'Foco na flexibilização de pensamentos disfuncionais, crenças intermediárias e experimentos comportamentais de exposição.'
  },
  {
    name: 'Psicanálise',
    desc: 'Formulações focadas nas formações do inconsciente, repressão edípica, Superego severo, transferência e livre associação.'
  },
  {
    name: 'Gestalt-terapia',
    desc: 'Intervenções baseadas na autorregulação organísmica, contato do self, ciclo de contato e atenção plena ao aqui-e-agora.'
  },
  {
    name: 'Sistêmica / Terapia Familiar',
    desc: 'Mapeamento circular interativo do clã familiar, genograma, triangulação de conflitos e ciclos patológicos repetitivos.'
  },
  {
    name: 'Humanista / Fenomenologia',
    desc: 'Foco na empatia incondicional, congruência terapêutica, autoatualização organísmica do eu e valor essencial do sujeito.'
  },
  {
    name: 'Junguiana / Psicologia Analítica',
    desc: 'Análise de símbolos de sonhos, arquétipos constitutivos do inconsciente coletivo, sombra pessoal e individuação.'
  }
];

export default function OnboardingAbordagem() {
  const { user, setUser } = useApp();
  const router = useRouter();

  // Form states
  const [selectedApproach, setSelectedApproach] = useState('TCC (Terapia Cognitivo-Comportamental)');
  const [description, setDescription] = useState('');

  React.useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) return null;

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();

    // Save to profile and redirect to tour
    setUser({
      ...user,
      mainApproach: selectedApproach,
      approachDescription: description
    });

    router.push('/onboarding/tour');
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-indigo-650/10 rounded-full blur-[100px] -z-10" />

      <div className="w-full max-w-xl bg-slate-900/30 border border-slate-800 rounded-3xl p-6 lg:p-8 backdrop-blur-xl space-y-6">
        {/* Progress header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Passo 2 de 3: Linha Teórica</span>
            <span className="text-indigo-400">66% Concluído</span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="w-2/3 h-full bg-indigo-600 rounded-full transition-all duration-300" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-200">Selecione sua principal linha teórica</h2>
          <p className="text-xs text-slate-400 leading-normal">
            As análises do copiloto AI se adequarão aos principais teóricos, hipóteses e vocabulário técnico da abordagem escolhida.
          </p>
        </div>

        <form onSubmit={handleNext} className="space-y-5">
          {/* Cards Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
            {APPROACHES.map((ap) => {
              const isSelected = selectedApproach === ap.name;
              return (
                <button
                  key={ap.name}
                  type="button"
                  onClick={() => setSelectedApproach(ap.name)}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-1.5 transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-350 shadow shadow-indigo-500/5'
                      : 'border-slate-855 border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Award className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <h4 className="text-xs font-bold text-slate-200">{ap.name}</h4>
                  </div>
                  <p className="text-[10px] leading-normal text-slate-400">{ap.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Description Textarea */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-350 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>Deseja especificar nuances ou preferências autorais? (Opcional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Utilizo psicanálise de orientação lacaniana, ou TCC com foco em terapia de aceitação e compromisso (ACT)..."
              rows={2}
              className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-650 outline-none transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push('/onboarding/perfil')}
              className="flex-1 inline-flex items-center justify-center gap-1 px-4 py-3.5 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>

            <button
              type="submit"
              className="flex-[2] inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-650/15"
            >
              <span>Prosseguir para Tour</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
