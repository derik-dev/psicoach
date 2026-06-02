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
  ChevronDown,
  Star,
  Sun
} from 'lucide-react';

export default function LandingPage() {
  const { user } = useApp();
  const router = useRouter();
  const [emailInput, setEmailInput] = useState('');
  const [caseInput, setCaseInput] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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
    <div className="bg-[#FAFBFD] text-slate-900 min-h-screen selection:bg-blue-600/10 selection:text-blue-700 relative overflow-x-hidden font-sans">
      <section className="hero-shell relative isolate overflow-hidden px-5 pb-20 pt-6">
        <div className="hero-fade" />
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
            <a href="#precos" className="transition-colors hover:text-slate-950">Preços</a>
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

        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center pt-16 text-center sm:pt-20 lg:pt-24" style={{ zoom: 0.88 }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/75 bg-white/80 px-5 py-2.5 text-[12px] font-semibold text-slate-600 shadow-[0_8px_28px_rgba(59,130,246,0.14)] backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            Copiloto clínico inteligente
          </div>

          <h1 className="hero-headline mt-7 max-w-5xl text-slate-950">
            Descreva. Analise.
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

      {/* Features Section */}
      <section id="diferenciais" className="bg-[#f4f6f9] py-24 lg:py-32 px-6">
        <div className="max-w-6xl mx-auto space-y-14">

          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-medium text-slate-500 mx-auto shadow-sm">
              <Sparkles className="w-3 h-3 text-blue-500" />
              <span>Recursos</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-light text-slate-800 tracking-tight leading-tight">
              Recursos inteligentes para uma prática clínica mais sólida
            </h2>
            <p className="text-slate-400 text-sm font-normal max-w-lg mx-auto leading-relaxed">
              Ferramentas criadas para enriquecer seu raciocínio terapêutico e dar suporte nos momentos mais complexos da rotina clínica.
            </p>
          </div>

          {/* Top row — 2 large cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Card 1 — Abordagens */}
            <div className="bg-white rounded-3xl p-8 flex flex-col gap-8 shadow-sm">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'TCC', sub: 'Ativo', color: 'text-blue-600' },
                  { label: 'Psicanálise', sub: 'Calibrado', color: 'text-slate-700' },
                  { label: 'Sistêmica', sub: 'Calibrado', color: 'text-slate-700' },
                ].map((item) => (
                  <div key={item.label} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center space-y-2 flex flex-col items-center justify-center">
                    <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                      <Brain className="w-4 h-4 text-blue-500" />
                    </div>
                    <span className={`text-[11px] font-semibold block ${item.color}`}>{item.label}</span>
                    <span className="text-[9px] text-slate-400 font-medium">{item.sub}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-slate-800">Abordagens Clínicas Precisas</h3>
                <p className="text-[13px] text-slate-400 leading-relaxed">
                  A IA formula insights respeitando sua abordagem — TCC, Psicanálise, Sistêmica e mais — com coerência técnica nas hipóteses.
                </p>
              </div>
            </div>

            {/* Card 2 — Análise estruturada */}
            <div className="bg-white rounded-3xl p-8 flex flex-col gap-8 shadow-sm">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex items-center justify-center h-36 overflow-hidden">
                <div className="flex items-end gap-[3px] h-16">
                  {[12, 22, 36, 28, 16, 40, 52, 32, 20, 44, 56, 34, 18, 38, 50, 30, 14, 42, 24, 16].map((h, i) => (
                    <span key={i} className="w-[3px] rounded-full bg-blue-400/70" style={{ height: `${h}px` }} />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-slate-800">Análise Estruturada em Segundos</h3>
                <p className="text-[13px] text-slate-400 leading-relaxed">
                  Receba hipóteses clínicas, perguntas para a próxima sessão e referências teóricas organizadas em um formato claro e profissional.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom row — 3 cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Card 3 — Chat */}
            <div className="bg-white rounded-3xl p-7 flex flex-col gap-7 shadow-sm">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                <div className="flex gap-2 items-start">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <Brain className="w-3 h-3 text-white" />
                  </div>
                  <div className="bg-white border border-slate-100 rounded-xl rounded-tl-none px-3 py-2 text-[11px] text-slate-600 shadow-sm">
                    Como lidar com a resistência do paciente?
                  </div>
                </div>
                <div className="flex gap-2 justify-end items-start">
                  <div className="bg-blue-600 rounded-xl rounded-tr-none px-3 py-2 text-[11px] text-white max-w-[80%]">
                    Tente experimentos comportamentais graduais...
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-slate-800">Chat por Caso</h3>
                <p className="text-[13px] text-slate-400 leading-relaxed">
                  Aprofunde pontos da análise em um chat contextualizado com todo o histórico do caso.
                </p>
              </div>
            </div>

            {/* Card 4 — Referências */}
            <div className="bg-white rounded-3xl p-7 flex flex-col gap-7 shadow-sm">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm">
                  <Search className="w-3.5 h-3.5 text-slate-300" />
                  <span className="text-[11px] text-slate-300">Pesquisar referências...</span>
                </div>
                <div className="space-y-2 pt-1">
                  <div className="h-2 bg-blue-500/20 rounded-full w-[75%]" />
                  <div className="h-2 bg-blue-500/10 rounded-full w-[55%]" />
                  <div className="h-2 bg-blue-500/10 rounded-full w-[65%]" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-slate-800">Literatura Sólida</h3>
                <p className="text-[13px] text-slate-400 leading-relaxed">
                  Toda hipótese vem acompanhada de referências bibliográficas de autores consolidados.
                </p>
              </div>
            </div>

            {/* Card 5 — LGPD */}
            <div className="bg-white rounded-3xl p-7 flex flex-col gap-7 shadow-sm">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-center h-[88px]">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Lock className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-slate-800">Privacidade & LGPD</h3>
                <p className="text-[13px] text-slate-400 leading-relaxed">
                  Dados clínicos criptografados de ponta a ponta. Nunca usados para publicidade ou treinamento de IA.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Abordagens Section */}
      <section id="abordagens" className="bg-[#f4f6f9] py-24 lg:py-32 px-6">
        <div className="max-w-6xl mx-auto space-y-14">

          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-medium text-slate-500 mx-auto shadow-sm">
              <Sparkle className="w-3 h-3 text-blue-500" />
              <span>Abordagens</span>
            </div>
            <h2 className="text-3xl sm:text-5xl text-slate-800 tracking-tight leading-tight">
              As principais <span className="font-semibold">abordagens teóricas</span> em um só lugar
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xl mx-auto">
              O PsiCoach AI compreende as nuances e vocabulários de cada referencial. Escolha o seu e receba análises coerentes com sua prática.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { symbol: 'TC', label: 'TCC', bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-600', title: 'Terapia Cognitivo-Comportamental', desc: 'Mapeamento de pensamentos automáticos, crenças intermediárias e experimentos comportamentais para mudança efetiva.' },
              { symbol: 'ψ', label: 'PSI', bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600', title: 'Psicanálise Freudiana e Lacaniana', desc: 'Análise do inconsciente, mecanismos de defesa, transferência e elaboração da economia libidinal do sujeito.' },
              { symbol: 'SF', label: 'SIS', bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-600', title: 'Terapia Sistêmica Familiar', desc: 'Padrões de comunicação intergeracional, triângulos relacionais e genogramas estruturais.' },
              { symbol: 'GT', label: 'GES', bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-600', title: 'Gestalt & Psicologia Humanista', desc: 'Consciência do presente (awareness), abordagem fenomenológica e relação terapêutica dialógica.' },
              { symbol: 'JA', label: 'JUN', bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-600', title: 'Psicologia Analítica Junguiana', desc: 'Sonhos, símbolos, inconsciente coletivo, análise arquetípica e processo de individuação.' },
              { symbol: 'IT', label: 'INT', bg: 'bg-pink-50', border: 'border-pink-100', text: 'text-pink-600', title: 'Formulação Clínica Integrativa', desc: 'Articulação flexível de diferentes pilares teóricos com foco na singularidade do paciente.' },
            ].map((item) => (
              <div key={item.label} className="bg-white rounded-2xl p-6 flex flex-col gap-10 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className={`w-11 h-11 rounded-xl ${item.bg} border ${item.border} flex items-center justify-center ${item.text} text-sm font-bold`}>
                    {item.symbol}
                  </div>
                  <span className="text-slate-300 text-lg leading-none">···</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-[15px] font-semibold text-slate-800 leading-snug">{item.title}</h3>
                  <p className="text-[13px] text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#f4f6f9] px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-3xl overflow-hidden" style={{ background: 'radial-gradient(ellipse at 20% 50%, #c7d9f8 0%, #dce8fb 40%, #edf3fd 100%)' }}>
            <div className="py-20 px-8 text-center space-y-8">

              <div className="space-y-4 max-w-2xl mx-auto">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl text-slate-800 tracking-tight font-light">
                  Atenda com mais clareza com o <span className="font-semibold">PsiCoach AI</span>
                </h2>
                <p className="text-slate-500 text-sm leading-relaxed max-w-md mx-auto">
                  Comece grátis por 7 dias. Sem cartão de crédito. Cancele quando quiser.
                </p>
              </div>

              <form onSubmit={handleEmailSubmit} className="max-w-sm mx-auto">
                <div className="bg-white/80 backdrop-blur-sm rounded-full py-1.5 pl-5 pr-2 flex items-center gap-3 shadow-sm focus-within:ring-2 focus-within:ring-blue-200 transition-all">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Seu endereço de e-mail"
                    className="bg-transparent outline-none text-sm text-slate-700 flex-1 placeholder:text-slate-400 min-w-0"
                  />
                  <button
                    type="submit"
                    className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 transition-colors shadow-md shadow-blue-500/25 active:scale-95 shrink-0"
                  >
                    <ArrowUpRight className="w-5 h-5" />
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="depoimentos" className="bg-[#f4f6f9] py-24 lg:py-32 px-6">
        <div className="max-w-6xl mx-auto space-y-10">

          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-medium text-slate-500 shadow-sm">
              <Users className="w-3 h-3 text-blue-500" />
              <span>Depoimentos</span>
            </div>
            <h2 className="text-3xl sm:text-5xl text-slate-800 tracking-tight leading-tight font-light">
              O que dizem as <span className="font-semibold">psicólogas</span> parceiras
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-lg mx-auto">
              Centenas de terapeutas no Brasil já usam o PsiCoach AI para preparar casos e ganhar mais clareza clínica.
            </p>
          </div>

          {/* Featured testimonial */}
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm flex flex-col md:flex-row">
            <div className="flex-1 p-10 flex flex-col justify-center gap-6">
              <p className="text-xl sm:text-2xl font-semibold text-slate-800 leading-snug">
                "O PsiCoach virou meu parceiro de raciocínio clínico. Entro em cada sessão com muito mais clareza e segurança nas intervenções."
              </p>
              <p className="text-[13px] text-slate-400 leading-relaxed">
                A profundidade técnica das análises é incrível. A coerência teórica nas respostas me traz insights que eu não conseguiria em grupos de WhatsApp ou supervisão esporádica.
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                  BM
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Dra. Beatriz Mendes</p>
                  <p className="text-xs text-slate-400">Psicóloga Clínica · Especialista TCC</p>
                </div>
              </div>
            </div>
            <div className="w-full md:w-[420px] h-[260px] md:h-auto bg-gradient-to-br from-blue-100 via-blue-200 to-indigo-300 shrink-0 flex items-center justify-center">
              <Brain className="w-24 h-24 text-white/50" />
            </div>
          </div>

          {/* 3 small cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { initials: 'MS', name: 'Mariana S.', role: 'Terapeuta Cognitiva · UFMG', stars: 4, quote: '"O questionamento socrático sugerido para um caso de TOC abriu caminhos que fizeram diferença real na adesão do paciente."' },
              { initials: 'LR', name: 'Lucas R.', role: 'Psicanalista · UFRJ', stars: 5, quote: '"O sigilo é minha maior exigência e a plataforma cumpre. Hipóteses ricas embasadas nos maiores teóricos da psicanálise."' },
              { initials: 'CF', name: 'Camila F.', role: 'Gestalt-terapeuta · PUC-SP', stars: 5, quote: '"Entro na sala de terapia com muito mais clareza conceitual. Sem dúvida elevou a qualidade dos meus atendimentos."' },
            ].map((t) => (
              <div key={t.initials} className="bg-white rounded-2xl p-6 flex flex-col justify-between gap-6 shadow-sm">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < t.stars ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                  ))}
                </div>
                <p className="text-[13px] text-slate-600 leading-relaxed flex-1">{t.quote}</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-semibold text-xs shrink-0">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{t.name}</p>
                    <p className="text-[11px] text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="bg-[#f4f6f9] py-24 lg:py-32 px-6">
        <div className="max-w-5xl mx-auto space-y-14">

          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-medium text-slate-500 shadow-sm">
              <Sparkles className="w-3 h-3 text-blue-500" />
              <span>Planos</span>
            </div>
            <h2 className="text-3xl sm:text-5xl text-slate-800 tracking-tight leading-tight font-light">
              Escolha o plano <span className="font-semibold">ideal para você</span>
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-lg mx-auto">
              Comece gratuitamente e evolua conforme sua prática cresce. Cancele quando quiser, sem burocracia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">

            {/* Starter */}
            <div className="bg-white rounded-3xl p-8 flex flex-col gap-6 shadow-sm border border-slate-100">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Starter</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-extrabold text-slate-800">R$&nbsp;97</span>
                  <span className="text-slate-400 text-sm mb-1">/mês</span>
                </div>
                <p className="text-[12px] text-slate-400 mt-1">Para quem está começando</p>
              </div>
              <ul className="space-y-3 flex-1">
                {[
                  'Até 15 análises clínicas por mês',
                  'Mapa clínico completo com hipótese e plano imediato',
                  'Perguntas clínicas prontas para a sessão',
                  'Histórico de casos salvo',
                  'Diretriz teórica personalizável',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-[13px] text-slate-600">
                    <Check className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/cadastro"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-all"
              >
                Começar agora
              </Link>
            </div>

            {/* Plus — destaque */}
            <div className="relative bg-blue-600 rounded-3xl p-8 flex flex-col gap-6 shadow-[0_24px_60px_rgba(37,99,235,0.30)]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-900 shadow">
                  <Star className="w-2.5 h-2.5" /> Mais popular
                </span>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-200 mb-1">Plus</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-extrabold text-white">R$&nbsp;120</span>
                  <span className="text-blue-300 text-sm mb-1">/mês</span>
                </div>
                <p className="text-[12px] text-blue-300 mt-1">Para clínicos em crescimento</p>
              </div>
              <ul className="space-y-3 flex-1">
                {[
                  'Tudo do Starter',
                  'Até 40 análises por mês',
                  'Análise de risco e proteção detalhada',
                  'Gerar nota de evolução automática',
                  'Gerar roteiro de perguntas',
                  'Biblioteca clínica completa',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-[13px] text-white/90">
                    <Check className="w-4 h-4 text-blue-300 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/cadastro"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-600 hover:bg-blue-50 transition-all shadow-md"
              >
                Assinar Plus <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-white rounded-3xl p-8 flex flex-col gap-6 shadow-sm border border-slate-100">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Pro</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-extrabold text-slate-800">R$&nbsp;207</span>
                  <span className="text-slate-400 text-sm mb-1">/mês</span>
                </div>
                <p className="text-[12px] text-slate-400 mt-1">Para clínicas e equipes</p>
              </div>
              <ul className="space-y-3 flex-1">
                {[
                  'Tudo do Plus',
                  'Análises ilimitadas',
                  'Múltiplas psicólogas na mesma conta',
                  'Painel gestor da clínica',
                  'Referências bibliográficas por caso',
                  'Suporte prioritário',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-[13px] text-slate-600">
                    <Check className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/cadastro"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-all"
              >
                Assinar Pro
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-to-footer bg-[#f4f6f9] px-6 pb-28 pt-24">
        <div className="max-w-3xl mx-auto space-y-12">

          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-medium text-slate-500 shadow-sm">
              <HelpCircle className="w-3 h-3 text-blue-500" />
              <span>FAQs</span>
            </div>
            <h2 className="text-3xl sm:text-5xl text-slate-800 tracking-tight leading-tight font-light">
              Perguntas <span className="font-semibold">Frequentes</span>
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
              Tudo o que você precisa saber sobre o PsiCoach AI. Não encontrou sua dúvida? Entre em contato.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'O PsiCoach AI substitui a supervisão clínica oficial?',
                a: 'Não. O PsiCoach AI é um copiloto clínico — uma segunda opinião disponível a qualquer hora. Ele não é reconhecido pelo CFP como supervisão oficial e não substitui o julgamento clínico da psicóloga. É uma ferramenta de apoio ao raciocínio terapêutico.',
              },
              {
                q: 'Meus dados clínicos são seguros?',
                a: 'Sim. Todos os dados são criptografados de ponta a ponta e nunca são usados para treinamento de IA ou publicidade. Você pode anonimizar os casos antes de descrever, e nós nunca pedimos dados identificadores do paciente.',
              },
              {
                q: 'Como funciona o limite de análises do plano Starter?',
                a: 'O plano Starter inclui 10 análises por mês. Cada vez que você clica em "Analisar caso", conta como uma análise. O contador zera todo mês na data de renovação. Os planos Pro e Clínica têm análises ilimitadas.',
              },
              {
                q: 'Posso cancelar quando quiser?',
                a: 'Sim, sem burocracia. Você pode cancelar a assinatura a qualquer momento nas configurações da sua conta. O acesso continua até o fim do período já pago.',
              },
              {
                q: 'A IA entende minha abordagem teórica específica?',
                a: 'Sim. Durante o onboarding você escolhe sua abordagem principal (TCC, Psicanálise, Sistêmica, Gestalt, Junguiana ou Integrativa) e todas as análises são geradas dentro desse referencial. Você pode alterar a abordagem a qualquer momento nas configurações.',
              },
              {
                q: 'Existe teste gratuito?',
                a: 'Sim. Você tem 7 dias gratuitos ao criar sua conta, sem precisar inserir cartão de crédito. Durante o teste você acessa todos os recursos do plano Pro.',
              },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left gap-4"
                >
                  <span className="text-[15px] font-medium text-slate-700">{item.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5">
                    <p className="text-[13px] text-slate-400 leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Footer */}
      <div className="footer-join bg-[#f4f6f9]">
      <footer
        className="site-footer relative text-white flex flex-col"
        style={{
          backgroundImage: "url('/imagens/imagem-bg-pc-ft.png')",
          backgroundSize: '100% 100%',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
          minHeight: '780px',
        }}
      >
        {/* Nav pill no topo */}
        <div className="flex justify-center pt-10">
          <nav className="flex items-center gap-8 rounded-full border border-white/55 bg-white/32 px-8 py-3 text-[12px] font-semibold text-white shadow-[0_14px_40px_rgba(37,99,235,0.16)] backdrop-blur-md ring-1 ring-white/20">
            <Link href="#diferenciais" className="hover:text-white transition-colors">Recursos</Link>
            <Link href="#abordagens" className="hover:text-white transition-colors">Abordagens</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Preços</Link>
            <Link href="#depoimentos" className="hover:text-white transition-colors">Depoimentos</Link>
          </nav>
        </div>

        {/* Espaço central — a imagem tem o texto grande */}
        <div className="flex-1" />

        {/* Rodapé: ícones sociais + copyright */}
        <div className="flex flex-col items-center gap-5 pb-10">
          <div className="flex items-center gap-3">
            {[
              { href: '#', svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg> },
              { href: '#', svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
              { href: '#', svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg> },
            ].map((s, i) => (
              <a
                key={i}
                href={s.href}
                className="w-11 h-11 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white hover:bg-white/25 transition-colors backdrop-blur-sm"
              >
                {s.svg}
              </a>
            ))}
          </div>
          <p className="text-white/50 text-xs">© 2026 PsiCoach AI. Todos os direitos reservados.</p>
        </div>
      </footer>
      </div>

    </div>
  );
}
