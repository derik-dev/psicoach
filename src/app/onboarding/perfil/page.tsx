'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Brain, ArrowRight, UserCircle, Star, Users } from 'lucide-react';

const SPECIALTIES = [
  'Ansiedade e Pânico',
  'Depressão e Humor',
  'Trauma e TEPT',
  'Transtornos Alimentares',
  'Dependência Química',
  'Desenvolvimento Pessoal',
  'Conflitos Amorosos',
  'TDAH / Neurodiversidade'
];

export default function OnboardingPerfil() {
  const { user, setUser } = useApp();
  const router = useRouter();

  // Form states
  const [experience, setExperience] = useState('1-2');
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  React.useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) return null;

  const togglePatient = (type: string) => {
    setSelectedPatients((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleSpecialty = (spec: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save to profile and redirect to step 2
    setUser({
      ...user,
      yearsExperience: experience,
      patientTypes: selectedPatients,
      specialties: selectedSpecialties
    });

    router.push('/onboarding/abordagem');
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-indigo-650/10 rounded-full blur-[100px] -z-10" />

      <div className="w-full max-w-xl bg-slate-900/30 border border-slate-800 rounded-3xl p-6 lg:p-8 backdrop-blur-xl space-y-6">
        {/* Progress header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Passo 1 de 3: Perfil Clínico</span>
            <span className="text-indigo-400">33% Concluído</span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="w-1/3 h-full bg-indigo-600 rounded-full transition-all duration-300" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-200">Nos conte mais sobre seu consultório</h2>
          <p className="text-xs text-slate-400 leading-normal">
            Personalizaremos o copiloto clínico com base nos anos de experiência e demandas do seu consultório.
          </p>
        </div>

        <form onSubmit={handleNext} className="space-y-6">
          {/* Experience Select */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-350 uppercase tracking-wider flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-indigo-400" />
              <span>Tempo de Atendimento Clínico</span>
            </label>
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-xs text-slate-100 outline-none transition-colors"
            >
              <option value="1-2">Recém-formada (1 a 2 anos)</option>
              <option value="3-5">Experiente inicial (3 a 5 anos)</option>
              <option value="5-10">Maturidade clínica (5 a 10 anos)</option>
              <option value="+10">Sênior (+10 anos)</option>
            </select>
          </div>

          {/* Patient Types Checkboxes */}
          <div className="space-y-2.5">
            <label className="text-[10px] font-bold text-slate-350 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Quem você atende em consultório?</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['Adultos', 'Adolescentes', 'Crianças', 'Casais'].map((type) => {
                const isSelected = selectedPatients.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => togglePatient(type)}
                    className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                        : 'border-slate-855 border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-400'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Specialties Checkboxes */}
          <div className="space-y-2.5">
            <label className="text-[10px] font-bold text-slate-350 uppercase tracking-wider flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-indigo-400" />
              <span>Suas principais áreas de foco / especialidades:</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SPECIALTIES.map((spec) => {
                const isSelected = selectedSpecialties.includes(spec);
                return (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => toggleSpecialty(spec)}
                    className={`p-2.5 rounded-xl border text-[11px] font-medium text-left transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-350 text-indigo-300'
                        : 'border-slate-855 border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-450 text-slate-400'
                    }`}
                  >
                    {spec}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CTA Next */}
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-650/15"
          >
            <span>Continuar para Abordagem</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
