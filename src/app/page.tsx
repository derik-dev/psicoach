'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import {
  Brain,
  Sparkles,
  ShieldCheck,
  Check,
  ArrowRight,
  ArrowUp,
  HelpCircle,
  Clock,
  BookOpen,
  Users,
  Sparkle,
  MessageSquare,
  Lock,
  Search,
  ArrowUpRight,
  ChevronRight,
  Star,
  Sun
} from 'lucide-react';

export default function LandingPage() {
  const { user } = useApp();
  const router = useRouter();
  const [emailInput, setEmailInput] = useState('');
  const [caseInput, setCaseInput] = useState('');

  // Se já estiver logado e completou o onboarding, redireciona para o dashboard
  React.useEffect(() => {
    if (user && user.onboardingCompleted) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleCaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (caseInput.trim()) {
      // Redireciona para o cadastro passando o rascunho de caso clínico digitado na landing page
      router.push(`/cadastro?draft=${encodeURIComponent(caseInput)}`);
    } else {
      router.push('/cadastro');
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      router.push(`/cadastro?email=${encodeURIComponent(emailInput)}`);
    } else {
      router.push('/cadastro');
    }
  };

  return (
    <div className="bg-[#FAFBFD] text-slate-900 min-h-screen selection:bg-blue-600/10 selection:text-blue-700 relative overflow-hidden font-sans">
      <section className="hero-shell relative isolate overflow-hidden px-5 pb-10 pt-6">
        <header className="relative z-20 mx-auto flex h-11 max-w-[1440px] items-center justify-between">
          <Link href="/" className="group inline-flex items-center">
            <span className="relative text-xl font-extrabold leading-none tracking-normal text-slate-950 sm:text-2xl">
              PsiCoach
              <span className="ml-1 text-blue-600">AI</span>
              <span className="absolute -bottom-1 left-0 h-[3px] w-[78%] rounded-full bg-slate-950 transition-all group-hover:w-full" />
            </span>
          </Link>

          <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-8 rounded-full border border-white/70 bg-white/76 px-9 py-3 text-[11px] font-semibold text-slate-500 shadow-[0_12px_40px_rgba(59,130,246,0.08)] backdrop-blur-md md:flex">
            <a href="#" className="transition-colors hover:text-slate-950">Início</a>
            <a href="#abordagens" className="transition-colors hover:text-slate-950">Biblioteca Clínica</a>
            <a href="#diferenciais" className="transition-colors hover:text-slate-950">Recursos</a>
            <a href="#depoimentos" className="transition-colors hover:text-slate-950">Depoimentos</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Alternar tema"
              className="hidden h-9 w-9 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-white/70 sm:inline-flex"
            >
              <Sun className="h-4 w-4" />
            </button>
            <Link
              href="/cadastro"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-[11px] font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,0.28)] transition-all hover:-translate-y-0.5 hover:bg-blue-500 active:translate-y-0"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Testar agora
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>

        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center pt-12 text-center sm:pt-14 lg:pt-16" style={{ zoom: 0.8 }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/75 bg-white/80 px-5 py-2.5 text-[12px] font-semibold text-slate-600 shadow-[0_8px_28px_rgba(59,130,246,0.14)] backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            Copiloto clínico inteligente
          </div>

          <h1 className="hero-headline mt-7 max-w-5xl text-slate-950">
            Descreva. Analise. <em>Acolha.</em>
            <br />
            Seu copiloto <span className="hero-headline-accent">clínico.</span>
          </h1>

          <p className="mt-6 max-w-[560px] text-sm font-normal leading-6 text-slate-500 sm:text-[15px]">
            Segunda opinião clínica disponível a qualquer hora.
          </p>

          <Link
            href="/cadastro"
            className="mt-8 inline-flex h-12 items-center justify-center gap-3 rounded-lg bg-blue-600 px-9 text-sm font-bold text-white shadow-[0_16px_34px_rgba(37,99,235,0.30)] transition-all hover:-translate-y-0.5 hover:bg-blue-500 active:translate-y-0"
          >
            Experimentar agora
            <ArrowRight className="h-4 w-4" />
          </Link>

          <form onSubmit={handleCaseSubmit} className="mt-10 w-full max-w-[640px] px-2">
            <div className="group flex min-h-[60px] items-center gap-3 rounded-full border border-white/85 bg-white/88 py-2 pl-4 pr-2 shadow-[0_20px_60px_rgba(37,99,235,0.18)] backdrop-blur-xl transition-all focus-within:border-blue-300 focus-within:bg-white">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center">
                <span className="hero-spark-icon" />
              </div>
              <input
                type="text"
                value={caseInput}
                onChange={(e) => setCaseInput(e.target.value)}
                placeholder="Descreva um caso clínico para uma segunda leitura..."
                className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-slate-800 outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                aria-label="Enviar caso"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_8px_24px_rgba(37,99,235,0.32)] transition-all hover:bg-blue-500 active:scale-95"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </form>

          <div className="mt-10 w-full space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/70">
              Compatível com as principais abordagens clínicas
            </p>
            <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-12 gap-y-4 text-white/60">
              {['TCC', 'PSICANÁLISE', 'SISTÊMICA', 'GESTALT', 'JUNGUIANA', 'INTEGRATIVA'].map((item) => (
                <span key={item} className="text-lg font-extrabold tracking-wider sm:text-xl">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Smarter Features - Bento Grid Section (from screenshot 2) */}
      <section id="diferenciais" className="bg-slate-50/50 border-t border-b border-slate-100 py-24 lg:py-32 px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            {/* Services Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/50 border border-blue-100/70 text-[10px] font-bold text-blue-600 mx-auto">
              <Sparkles className="w-3 h-3 text-blue-500" />
              <span>DIFERENCIAIS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Recursos Inteligentes para uma Prática Clínica Fluida
            </h2>
            <p className="text-slate-500 text-sm font-normal">
              Acesse ferramentas integradas e éticas criadas para enriquecer seu raciocínio terapêutico e dar suporte nos momentos complexos da rotina clínica.
            </p>
          </div>

          {/* Bento-Style Grid Layout (from screenshot 2) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Bento Card 1: Advanced Clinical Calibration (from screenshot 2 Left Upper) */}
            <div className="bg-white border border-slate-150 rounded-3xl p-8 flex flex-col justify-between shadow-sm shadow-slate-100 gap-8">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-center space-y-2">
                  <span className="text-[10px] font-bold text-blue-600 block">TCC</span>
                  <span className="text-[9px] text-slate-400 font-medium">Ativo</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-center space-y-2">
                  <span className="text-[10px] font-bold text-slate-700 block">Psicanálise</span>
                  <span className="text-[9px] text-slate-400 font-medium">Calibrado</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-center space-y-2">
                  <span className="text-[10px] font-bold text-slate-700 block">Sistêmica</span>
                  <span className="text-[9px] text-slate-400 font-medium">Calibrado</span>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Abordagens Clínicas Precisas</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  A IA formula insights respeitando rigorosamente a abordagem de sua escolha (TCC, Psicanálise, etc.), garantindo coerência técnica nas hipóteses e tarefas.
                </p>
              </div>
            </div>

            {/* Bento Card 2: Voice Mode Waveform Visual (from screenshot 2 Right Upper) */}
            <div className="bg-white border border-slate-150 rounded-3xl p-8 flex flex-col justify-between shadow-sm shadow-slate-100 md:col-span-2 gap-8">
              <div className="bg-gradient-to-r from-blue-50/30 to-indigo-50/20 border border-slate-100/80 rounded-2xl p-6 flex items-center justify-center h-28 relative overflow-hidden">
                {/* Waveform graphic representation */}
                <div className="flex items-center gap-1.5 h-12">
                  <span className="w-1 h-3 bg-blue-400/40 rounded-full" />
                  <span className="w-1 h-6 bg-blue-500/60 rounded-full animate-pulse" />
                  <span className="w-1 h-10 bg-blue-600 rounded-full" />
                  <span className="w-1 h-7 bg-indigo-500 rounded-full" />
                  <span className="w-1 h-5 bg-indigo-400/70 rounded-full" />
                  <span className="w-1 h-9 bg-blue-500/85 rounded-full" />
                  <span className="w-1 h-12 bg-blue-600 rounded-full" />
                  <span className="w-1 h-6 bg-indigo-600 rounded-full" />
                  <span className="w-1 h-4 bg-indigo-400/40 rounded-full" />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Questionamento Socrático & Reflexão</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  Receba propostas detalhadas de perguntas abertas e reflexivas estruturadas de forma socrática, perfeitas para auxiliar o paciente a descobrir novos significados.
                </p>
              </div>
            </div>

            {/* Bento Card 3: Chat Clínico Interativo (from screenshot 2 Left Bottom) */}
            <div className="bg-white border border-slate-150 rounded-3xl p-8 flex flex-col justify-between shadow-sm shadow-slate-100 gap-8">
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-3 text-[10px] leading-relaxed">
                <div className="flex gap-2">
                  <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center shrink-0">
                    <Brain className="w-3 h-3 text-white" />
                  </div>
                  <div className="bg-white border border-slate-100 rounded-lg p-2.5 text-slate-700 shadow-sm font-medium">
                    Como posso conduzir a resistência em sessão?
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <div className="bg-blue-650 text-white rounded-lg p-2.5 max-w-[85%] font-medium">
                    Tente experimentos comportamentais gradativos ou questionamento...
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Chat de Aprofundamento por Caso</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  Depois de receber a análise teórica de um caso, você pode abrir o chat e tirar dúvidas clínicas secundárias ou simular possíveis diálogos com o paciente.
                </p>
              </div>
            </div>

            {/* Bento Card 4: Web Search (from screenshot 2 Middle Bottom) */}
            <div className="bg-white border border-slate-150 rounded-3xl p-8 flex flex-col justify-between shadow-sm shadow-slate-100 gap-8">
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-3">
                <div className="bg-white border border-slate-150 rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-sm">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] text-slate-500 font-normal">Pesquisar referências...</span>
                </div>
                <div className="h-0.5 bg-blue-600/10 rounded-full w-[80%]" />
                <div className="h-0.5 bg-blue-600/10 rounded-full w-[50%]" />
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Referências e Literatura Sólida</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  Todas as hipóteses sugeridas acompanham sugestões de bibliografia teórica consolidada de autores renomados, fornecendo respaldo científico às suas anotações.
                </p>
              </div>
            </div>

            {/* Bento Card 5: Shield / Security (from screenshot 2 Right Bottom) */}
            <div className="bg-white border border-slate-150 rounded-3xl p-8 flex flex-col justify-between shadow-sm shadow-slate-100 gap-8">
              <div className="flex items-center justify-center h-24">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-inner">
                  <Lock className="w-7 h-7 text-blue-600" />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Anonimização e Conformidade LGPD</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  Sua privacidade e o sigilo profissional são prioridades máximas. Dados clínicos são criptografados de ponta a ponta e nunca utilizados para fins de publicidade.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Model Cards Grid Section (from screenshot 3) */}
      <section id="abordagens" className="py-24 lg:py-32 px-6 max-w-7xl mx-auto space-y-16">
        
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          {/* Features Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/50 border border-blue-100/70 text-[10px] font-bold text-blue-600 mx-auto">
            <Sparkle className="w-3 h-3 text-blue-500" />
            <span>ABORDAGENS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            As Maiores Abordagens Teóricas em um Só Lugar
          </h2>
          <p className="text-slate-500 text-sm font-normal">
            O PsiCoach AI compreende as nuances, vocabulários e estruturas conceituais de múltiplos referenciais. Escolha o seu referencial teórico principal:
          </p>
        </div>

        {/* 6 Models Card Grid (from screenshot 3) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: TCC */}
          <div className="bg-white border border-slate-150 rounded-3xl p-7 space-y-5 shadow-sm shadow-slate-100/50 relative hover:border-blue-400/50 hover:-translate-y-1 hover:shadow-md hover:shadow-blue-500/5 transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 text-sm font-bold">
                TC
              </div>
              <span className="text-slate-350 text-xs font-bold font-mono">...</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">TCC (Terapia Cognitivo-Comportamental)</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                Mapeamento de pensamentos automáticos disfuncionais, identificação de crenças intermediárias/centrais e formulação de experimentos comportamentais.
              </p>
            </div>
          </div>

          {/* Card 2: Psicanálise */}
          <div className="bg-white border border-slate-150 rounded-3xl p-7 space-y-5 shadow-sm shadow-slate-100/50 relative hover:border-blue-400/50 hover:-translate-y-1 hover:shadow-md hover:shadow-blue-500/5 transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold">
                ψ
              </div>
              <span className="text-slate-350 text-xs font-bold font-mono">...</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Psicanálise (Freudiana e Lacaniana)</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                Análise baseada na manifestação do inconsciente, mecanismos de defesa do ego, elaboração de transferência e análise da economia libidinal do sujeito.
              </p>
            </div>
          </div>

          {/* Card 3: Sistêmica */}
          <div className="bg-white border border-slate-150 rounded-3xl p-7 space-y-5 shadow-sm shadow-slate-100/50 relative hover:border-blue-400/50 hover:-translate-y-1 hover:shadow-md hover:shadow-blue-500/5 transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-600 text-sm font-bold">
                SF
              </div>
              <span className="text-slate-350 text-xs font-bold font-mono">...</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Terapia Sistêmica Familiar</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                Investigação de padrões de comunicação intergeracional, dinâmicas de triângulos relacionais e formulações de genogramas estruturais.
              </p>
            </div>
          </div>

          {/* Card 4: Humanismo & Gestalt */}
          <div className="bg-white border border-slate-150 rounded-3xl p-7 space-y-5 shadow-sm shadow-slate-100/50 relative hover:border-blue-400/50 hover:-translate-y-1 hover:shadow-md hover:shadow-blue-500/5 transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-bold">
                GT
              </div>
              <span className="text-slate-350 text-xs font-bold font-mono">...</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Gestalt & Psicologia Humanista</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                Foco na conscientização do presente (awareness), abordagem fenomenológica centrada na pessoa, contato e na relação terapêutica dialógica direta.
              </p>
            </div>
          </div>

          {/* Card 5: Junguiana */}
          <div className="bg-white border border-slate-150 rounded-3xl p-7 space-y-5 shadow-sm shadow-slate-100/50 relative hover:border-blue-400/50 hover:-translate-y-1 hover:shadow-md hover:shadow-blue-500/5 transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 text-sm font-bold">
                JA
              </div>
              <span className="text-slate-350 text-xs font-bold font-mono">...</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Psicologia Analítica Junguiana</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                Ampliação de materiais oníricos (sonhos), símbolos do inconsciente pessoal e coletivo, análise arquetípica e facilitação do processo de individuação.
              </p>
            </div>
          </div>

          {/* Card 6: Integrativa */}
          <div className="bg-white border border-slate-150 rounded-3xl p-7 space-y-5 shadow-sm shadow-slate-100/50 relative hover:border-blue-400/50 hover:-translate-y-1 hover:shadow-md hover:shadow-blue-500/5 transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-600 text-sm font-bold">
                IT
              </div>
              <span className="text-slate-350 text-xs font-bold font-mono">...</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Formulação Clínica Integrativa</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                Articulação flexível e embasada cientificamente de diferentes pilares teóricos com foco estrito na demanda e singularidade única do paciente.
              </p>
            </div>
          </div>


        </div>
      </section>

      {/* CTA Boxed Section (from screenshot 4 style) */}
      <section className="px-6 py-12 max-w-7xl mx-auto">
        <div className="bg-gradient-to-tr from-blue-600/10 via-indigo-600/5 to-transparent border border-blue-150 rounded-[40px] py-16 px-8 sm:px-16 text-center space-y-8 relative overflow-hidden shadow-sm">
          
          <div className="space-y-4 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
              Sua prática clínica mais segura com o PsiCoach AI
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed font-normal">
              Eleve o patamar de suas formulações diagnósticas e intervenções terapêuticas. Faça seu teste gratuito de 7 dias hoje mesmo, sem compromisso técnico.
            </p>
          </div>

          {/* Centered Email Capture (from screenshot 4) */}
          <form onSubmit={handleEmailSubmit} className="relative max-w-md mx-auto">
            <div className="bg-white border border-slate-200/80 rounded-full py-1.5 pl-5 pr-2 shadow-md shadow-slate-100 flex items-center justify-between gap-3 focus-within:border-blue-450 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-200">
              <input 
                type="email" 
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Seu endereço de e-mail de contato..." 
                className="bg-transparent border-none outline-none text-slate-800 text-xs sm:text-sm flex-1 placeholder:text-slate-400 font-normal min-w-0"
              />
              <button 
                type="submit"
                className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 transition-colors shadow shadow-blue-500/20 active:scale-95 shrink-0"
              >
                <ArrowUpRight className="w-5 h-5" />
              </button>
            </div>
          </form>

        </div>
      </section>

      {/* Testimonials Section (from screenshot 5) */}
      <section id="depoimentos" className="py-24 lg:py-32 px-6 max-w-7xl mx-auto space-y-16">
        
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          {/* Testimonials Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/50 border border-blue-100/70 text-[10px] font-bold text-blue-600 mx-auto">
            <Users className="w-3 h-3 text-blue-500" />
            <span>DEPOIMENTOS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            O que dizem as psicólogas parceiras
          </h2>
          <p className="text-slate-500 text-sm font-normal">
            Junte-se a centenas de terapeutas em todo o Brasil que integraram a inteligência artificial ao seu planejamento de atendimentos.
          </p>
        </div>

        {/* Big Testimonial Highlight Card (from screenshot 5 Upper) */}
        <div className="bg-white border border-slate-150 rounded-[32px] p-8 md:p-12 shadow-sm shadow-slate-100/60 max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-10">
          
          <div className="flex-1 space-y-6">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <p className="text-slate-700 text-base sm:text-lg font-medium leading-relaxed italic">
              "Encontrei no PsiCoach AI o parceiro de estudos clínicos que me faltava. A profundidade técnica das análises é incrível, e a coerência teórica nas respostas me traz insights de alta qualidade, servindo de apoio clínico perfeito na preparação de casos complexos."
            </p>
            <div className="space-y-1 border-l-2 border-blue-600 pl-4">
              <h4 className="text-sm font-bold text-slate-900">Dra. Beatriz Mendes</h4>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Psicóloga Clínica - Especialista TCC (USP)</p>
            </div>
          </div>

          <div className="w-full md:w-[320px] h-[280px] bg-slate-100 border border-slate-150 rounded-2xl overflow-hidden relative shadow-inner shrink-0 flex items-center justify-center">
            {/* Minimal High-fidelity visual mockup of professional portrait */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent z-10" />
            <Brain className="w-20 h-20 text-slate-350 opacity-40 animate-pulse" />
            <div className="absolute bottom-4 left-4 z-20">
              <span className="px-2.5 py-1 bg-white/95 backdrop-blur-sm border border-slate-150 text-[10px] font-bold text-slate-700 rounded-full shadow-sm">
                Usuária Premium
              </span>
            </div>
          </div>

        </div>

        {/* Small Testimonials Grid (from screenshot 5 Lower) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto pt-6">
          
          {/* Card 1 */}
          <div className="bg-white border border-slate-150 rounded-3xl p-6 space-y-5 shadow-sm shadow-slate-100/50">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs text-slate-650 leading-relaxed font-medium">
              "Fiquei surpresa com o questionamento socrático sugerido para um caso de TOC. Abriu caminhos clínicos excelentes que fizeram total diferença na adesão do paciente na sessão seguinte."
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs border border-slate-150">
                MS
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-900">Mariana S.</h5>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Terap. Cognitiva (UFMG)</p>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-slate-150 rounded-3xl p-6 space-y-5 shadow-sm shadow-slate-100/50">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs text-slate-650 leading-relaxed font-medium">
              "O sigilo ético absoluto é minha maior exigência e a plataforma cumpre com louvor. Relatos clínicos 100% descaracterizados me trazem hipóteses ricas embasadas nos maiores teóricos."
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs border border-slate-150">
                LR
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-900">Lucas R.</h5>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Psicanalista (UFRJ)</p>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-slate-150 rounded-3xl p-6 space-y-5 shadow-sm shadow-slate-100/50">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs text-slate-650 leading-relaxed font-medium">
              "O PsiCoach virou parte fundamental da minha rotina. Entro na sala de terapia com muito mais clareza conceitual de intervenção. Sem dúvida, elevou a qualidade dos meus atendimentos."
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs border border-slate-150">
                CF
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-900">Camila F.</h5>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Gestalt-terapeuta (PUC-SP)</p>
              </div>
            </div>
          </div>

        </div>

      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-12 bg-white text-slate-450 text-xs">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shadow shadow-blue-650/15">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-sm text-slate-900">PsiCoach AI</span>
          </div>

          <div className="flex items-center gap-6 flex-wrap justify-center text-slate-550 font-medium">
            <span>© 2026 PsiCoach AI. Todos os direitos reservados.</span>
            <Link href="/pricing" className="hover:text-blue-600 transition-colors">Preços</Link>
            <Link href="/login" className="hover:text-blue-600 transition-colors">Login</Link>
            <Link href="/cadastro" className="hover:text-blue-600 transition-colors">Cadastro</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
