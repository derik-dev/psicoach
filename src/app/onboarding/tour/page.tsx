'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  Brain,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Layers,
  HelpCircle,
  ShieldCheck,
  Zap
} from 'lucide-react';

export default function OnboardingTour() {
  const { user, setUser } = useApp();
  const router = useRouter();
  
  const [slide, setSlide] = useState(0);

  React.useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) return null;

  const slides = [
    {
      title: "Como funciona a Análise Clínica?",
      desc: "Você descreve o relato do caso, falas emblemáticas e sintomas. A inteligência artificial de última geração analisa as informações cruzando com literatura de ponta e com a sua abordagem teórica de preferência.",
      icon: Brain,
      badge: "Passo 1: Descrever"
    },
    {
      title: "Consulte Intervenções e Referências",
      desc: "A resposta é totalmente estruturada em seções intuitivas: hipótese diagnóstica, sugestões práticas de caminhos terapêuticos, sugestão de perguntas de reestruturação/exposição para a sessão e embasamento bibliográfico.",
      icon: Layers,
      badge: "Passo 2: Revisar"
    },
    {
      title: "Aprofunde em Chat Livre sobre o Caso",
      desc: "Após a análise, uma caixa de chat complementar é aberta. Você pode conversar de forma contínua com a inteligência artificial, pedir para detalhar teorias, sugerir experimentos ou debater resistências e contra-transferências.",
      icon: Zap,
      badge: "Passo 3: Aprofundar"
    }
  ];

  const current = slides[slide];

  const handleNext = () => {
    if (slide < slides.length - 1) {
      setSlide(slide + 1);
    } else {
      // Mark onboarding as completed
      setUser({
        ...user,
        onboardingCompleted: true
      });
      router.push('/nova-analise');
    }
  };

  const handleBack = () => {
    if (slide > 0) {
      setSlide(slide - 1);
    } else {
      router.push('/onboarding/abordagem');
    }
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-indigo-650/10 rounded-full blur-[100px] -z-10" />

      <div className="w-full max-w-xl bg-slate-900/30 border border-slate-800 rounded-3xl p-6 lg:p-8 backdrop-blur-xl space-y-6">
        {/* Progress header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Passo 3 de 3: Tour Guiado</span>
            <span className="text-indigo-400">99% Concluído</span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="w-full h-full bg-indigo-600 rounded-full transition-all duration-300" />
          </div>
        </div>

        {/* Animated Slide Display */}
        <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-850 space-y-5 text-center min-h-[300px] flex flex-col justify-center items-center relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl" />
          
          {/* Badge */}
          <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
            {current.badge}
          </span>
          
          {/* Icon */}
          <div className="p-4 rounded-full bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 animate-pulse mt-2">
            <current.icon className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-200">{current.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
              {current.desc}
            </p>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {slides.map((_, idx) => (
              <span
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  slide === idx ? 'w-4 bg-indigo-500' : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Compliance Footer check */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 flex gap-3 text-slate-500 text-[10px] leading-relaxed">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <strong>Lembre-se sempre:</strong> O sigilo ético é o coração da clínica. Nunca digite nomes civis completos, endereços exatos ou dados explícitos de identificação pessoal dos pacientes. Cumpra com as diretrizes do CFP.
          </span>
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleBack}
            className="flex-1 inline-flex items-center justify-center gap-1 px-4 py-3.5 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="flex-[2] inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-650/15"
          >
            <span>
              {slide === slides.length - 1 ? 'Iniciar Primeira Análise' : 'Próximo Passo'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
