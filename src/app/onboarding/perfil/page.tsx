'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { ArrowRight, Star, Users } from 'lucide-react';

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

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();

    await setUser({
      ...user,
      yearsExperience: experience,
      patientTypes: selectedPatients,
      specialties: selectedSpecialties
    });

    router.push('/onboarding/abordagem');
  };

  return (
    <div className="bg-[#FAFBFD] text-slate-900 min-h-screen flex items-center justify-center p-5 font-sans">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-100 shadow-sm p-8 lg:p-10 space-y-7">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            <span>Passo 1 de 3 · Perfil Clínico</span>
            <span className="text-blue-600">33%</span>
          </div>
          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className="w-1/3 h-full bg-blue-600 rounded-full transition-all duration-300" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="page-headline">
            Nos conte sobre seu <span className="page-headline-accent">consultório.</span>
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed max-w-lg">
            Personalizaremos o copiloto clínico com base na sua experiência e nas demandas que você mais atende.
          </p>
        </div>

        <form onSubmit={handleNext} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-blue-600" />
              <span>Tempo de Atendimento Clínico</span>
            </label>
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none transition-all"
            >
              <option value="1-2">Recém-formada (1 a 2 anos)</option>
              <option value="3-5">Experiente inicial (3 a 5 anos)</option>
              <option value="5-10">Maturidade clínica (5 a 10 anos)</option>
              <option value="+10">Sênior (+10 anos)</option>
            </select>
          </div>

          <div className="space-y-2.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Quem você atende?</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {['Adultos', 'Adolescentes', 'Crianças', 'Casais'].map((type) => {
                const isSelected = selectedPatients.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => togglePatient(type)}
                    className={`p-3.5 rounded-xl border text-sm font-medium text-left transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-blue-600" />
              <span>Áreas de foco / especialidades</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SPECIALTIES.map((spec) => {
                const isSelected = selectedSpecialties.includes(spec);
                return (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => toggleSpecialty(spec)}
                    className={`p-3 rounded-xl border text-[12px] font-medium text-left transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                    }`}
                  >
                    {spec}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-all shadow-[0_12px_28px_rgba(37,99,235,0.28)] hover:-translate-y-0.5"
          >
            <span>Continuar para Abordagem</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
