'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  Brain,
  Check,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Clock,
  ShieldCheck,
  Coins
} from 'lucide-react';

export default function PricingPage() {
  const { activePlan, setActivePlan, user } = useApp();
  const router = useRouter();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  const handleSelectPlan = (plan: 'starter' | 'pro' | 'clinica') => {
    setActivePlan(plan);
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/cadastro');
    }
  };

  const starterPrice = billingPeriod === 'monthly' ? 97 : Math.round(97 * 0.8);
  const proPrice = billingPeriod === 'monthly' ? 197 : Math.round(197 * 0.8);
  const clinicaPrice = billingPeriod === 'monthly' ? 397 : Math.round(397 * 0.8);

  const features = [
    { name: "Análises de Caso Clínico por Mês", starter: "10", pro: "Ilimitado", clinica: "Ilimitado" },
    { name: "Chat Complementar Livre de Aprofundamento", starter: "Básico", pro: "Avançado", clinica: "Avançado" },
    { name: "Sugestões de Intervenção Prática", starter: "Sim", pro: "Sim", clinica: "Sim" },
    { name: "Questionamento Socrático", starter: "Sim", pro: "Sim", clinica: "Sim" },
    { name: "Referências Bibliográficas com Autores", starter: "Não", pro: "Sim", clinica: "Sim" },
    { name: "Anotações Clínicas & Editor de Tags", starter: "Sim", pro: "Sim", clinica: "Sim" },
    { name: "Painel Gestor Unificado (Multi-psicólogas)", starter: "Não", pro: "Não", clinica: "Até 5 Contas" },
    { name: "Conformidade Criptografada LGPD", starter: "Sim", pro: "Sim", clinica: "Sim" },
  ];

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen selection:bg-indigo-650 selection:text-white flex flex-col justify-between">
      {/* Header / Navbar */}
      <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-900/60 h-16 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto h-full px-4 lg:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <Brain className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="font-bold text-base bg-gradient-to-r from-indigo-200 via-purple-300 to-indigo-200 bg-clip-text text-transparent">
              PsiCoach <span className="text-indigo-400 font-medium">AI</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs font-semibold text-slate-350 hover:text-indigo-400 transition-colors"
            >
              Página Inicial
            </Link>
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-350 hover:text-indigo-400 transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition-colors shadow-md shadow-indigo-600/10"
            >
              Criar Conta Grátis
            </Link>
          </div>
        </div>
      </header>

      {/* Main Pricing Area */}
      <main className="max-w-6xl w-full mx-auto px-4 lg:px-8 py-12 lg:py-20 flex-1 space-y-12">
        {/* Title */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Invista na segurança das suas condutas clínicas.
          </h1>
          <p className="text-slate-450 text-sm sm:text-base leading-relaxed">
            Economize milhares de reais em supervisões avulsas e garanta uma segunda opinião científica qualificada a qualquer hora do dia ou da noite.
          </p>

          {/* Monthly / Annual Toggle */}
          <div className="inline-flex items-center gap-2 p-1.5 rounded-full bg-slate-900 border border-slate-850 mx-auto">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                billingPeriod === 'monthly' ? 'bg-indigo-605 bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`relative px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                billingPeriod === 'annual' ? 'bg-indigo-605 bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Anual</span>
              <span className="bg-emerald-500 text-slate-950 font-extrabold text-[8px] px-1 py-0.2 rounded uppercase scale-95 font-sans">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* 3 cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Card 1: Starter */}
          <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800 flex flex-col justify-between h-[450px]">
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Início Clínico</span>
                <h3 className="text-lg font-bold text-slate-250">PsiCoach Starter</h3>
              </div>

              <div className="flex items-baseline gap-1 py-2">
                <span className="text-3xl font-extrabold text-white">R$ {starterPrice}</span>
                <span className="text-xs text-slate-500">/ mês</span>
              </div>
              <p className="text-xs text-slate-400 leading-normal">
                Ideal para recém-formadas que querem experimentar e obter suporte nos primeiros casos complexos.
              </p>
              
              <ul className="space-y-2 pt-4">
                <li className="text-xs text-slate-300 flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>10 análises clínicas por mês</span>
                </li>
                <li className="text-xs text-slate-300 flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Anotações & Evolução clínica</span>
                </li>
                <li className="text-xs text-slate-300 flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Conformidade Criptografada LGPD</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSelectPlan('starter')}
              className="w-full py-3 text-xs font-bold rounded-xl border border-slate-850 hover:border-indigo-500/30 hover:bg-indigo-500/10 text-slate-200 hover:text-indigo-300 transition-all text-center"
            >
              Assinar Plano Starter →
            </button>
          </div>

          {/* Card 2: Pro */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-indigo-950/20 border-2 border-indigo-500 flex flex-col justify-between h-[450px] relative shadow-[0_0_30px_rgba(99,102,241,0.1)]">
            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[8px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-bl">Mais Popular</div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                  <span>Maturidade Clínica</span>
                </span>
                <h3 className="text-lg font-bold text-white">PsiCoach Pro</h3>
              </div>

              <div className="flex items-baseline gap-1 py-2">
                <span className="text-3xl font-extrabold text-white">R$ {proPrice}</span>
                <span className="text-xs text-slate-500">/ mês</span>
              </div>
              <p className="text-xs text-indigo-200/80 leading-normal">
                Análises ilimitadas e referências bibliográficas robustas para profissionais com agenda cheia e casos recorrentes.
              </p>
              
              <ul className="space-y-2 pt-4">
                <li className="text-xs text-slate-300 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <strong className="text-white">Análises clínicas ILIMITADAS</strong>
                </li>
                <li className="text-xs text-slate-300 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Chat avançado de aprofundamento</span>
                </li>
                <li className="text-xs text-slate-300 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Referências completas com autores</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSelectPlan('pro')}
              className="w-full py-3 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors text-center shadow shadow-indigo-650/20"
            >
              Assinar Plano Pro →
            </button>
          </div>

          {/* Card 3: Clínica */}
          <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800 flex flex-col justify-between h-[450px]">
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Espaços e Times</span>
                <h3 className="text-lg font-bold text-slate-250">PsiCoach Clínica</h3>
              </div>

              <div className="flex items-baseline gap-1 py-2">
                <span className="text-3xl font-extrabold text-white">R$ {clinicaPrice}</span>
                <span className="text-xs text-slate-500">/ mês</span>
              </div>
              <p className="text-xs text-slate-400 leading-normal">
                Painel administrativo gestor multi-usuárias para clínicas, consultórios coletivos ou parcerias de pós-graduação.
              </p>
              
              <ul className="space-y-2 pt-4">
                <li className="text-xs text-slate-300 flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Contas para até 5 psicólogas</span>
                </li>
                <li className="text-xs text-slate-300 flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Painel do gestor administrativo</span>
                </li>
                <li className="text-xs text-slate-300 flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Suporte prioritário via WhatsApp</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSelectPlan('clinica')}
              className="w-full py-3 text-xs font-bold rounded-xl border border-slate-850 hover:border-indigo-500/30 hover:bg-indigo-500/10 text-slate-200 hover:text-indigo-300 transition-all text-center"
            >
              Assinar Plano Clínica →
            </button>
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="space-y-4 pt-12">
          <h2 className="text-center text-lg font-bold tracking-tight text-white flex items-center justify-center gap-2">
            <Coins className="w-5 h-5 text-indigo-400" />
            <span>Comparativo Completo de Recursos</span>
          </h2>
          
          <div className="overflow-x-auto rounded-2xl border border-slate-900">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-900 font-bold uppercase tracking-wider">
                  <th className="p-4">Funcionalidade / Benefício</th>
                  <th className="p-4 text-center">Starter</th>
                  <th className="p-4 text-center">Pro</th>
                  <th className="p-4 text-center">Clínica</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 bg-slate-900/5">
                {features.map((feat, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/20">
                    <td className="p-4 font-medium text-slate-300">{feat.name}</td>
                    <td className="p-4 text-center font-semibold text-slate-450">{feat.starter}</td>
                    <td className="p-4 text-center font-bold text-indigo-300">{feat.pro}</td>
                    <td className="p-4 text-center font-semibold text-slate-350">{feat.clinica}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900/60 py-12 bg-slate-950 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-slate-900 border border-slate-800 flex items-center justify-center">
              <Brain className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="font-semibold text-slate-400">PsiCoach AI</span>
          </div>

          <div className="flex items-center gap-6">
            <span>© 2026 PsiCoach AI. Todos os direitos reservados.</span>
            <Link href="/" className="hover:text-slate-350">Página Inicial</Link>
            <Link href="/login" className="hover:text-slate-350">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
