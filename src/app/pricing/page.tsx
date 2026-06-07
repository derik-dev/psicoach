'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Check, Sparkles, Coins } from 'lucide-react';
import { startCheckout } from '@/lib/stripe/client';

export default function PricingPage() {
  const { user } = useApp();
  const router = useRouter();
  const [planError, setPlanError] = useState<string | null>(null);
  const [selectingPlan, setSelectingPlan] = useState<'starter' | 'plus' | 'pro' | null>(null);

  const handleSelectPlan = async (plan: 'starter' | 'plus' | 'pro') => {
    if (!user) {
      localStorage.setItem('pendingPlan', plan);
      router.push('/cadastro');
      return;
    }

    setSelectingPlan(plan);
    setPlanError(null);

    try {
      await startCheckout(plan);
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : 'Não foi possível iniciar o pagamento.');
    } finally {
      setSelectingPlan(null);
    }
  };

  const features = [
    { name: 'Análises por Mês', starter: '15', plus: '40', pro: 'Ilimitado' },
    { name: 'Mapa clínico com hipótese e plano imediato', starter: 'Sim', plus: 'Sim', pro: 'Sim' },
    { name: 'Perguntas clínicas prontas para sessão', starter: 'Sim', plus: 'Sim', pro: 'Sim' },
    { name: 'Histórico de casos salvo', starter: 'Sim', plus: 'Sim', pro: 'Sim' },
    { name: 'Diretriz teórica personalizável', starter: 'Sim', plus: 'Sim', pro: 'Sim' },
    { name: 'Análise de risco e proteção detalhada', starter: 'Não', plus: 'Sim', pro: 'Sim' },
    { name: 'Nota de evolução automática', starter: 'Não', plus: 'Sim', pro: 'Sim' },
    { name: 'Roteiro de perguntas clínicas', starter: 'Não', plus: 'Sim', pro: 'Sim' },
    { name: 'Referências bibliográficas por caso', starter: 'Não', plus: 'Não', pro: 'Sim' },
    { name: 'Múltiplas psicólogas na mesma conta', starter: 'Não', plus: 'Não', pro: 'Sim' },
    { name: 'Conformidade LGPD', starter: 'Sim', plus: 'Sim', pro: 'Sim' },
  ];

  return (
    <div className="bg-[#FAFBFD] text-slate-900 min-h-screen font-sans flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto h-16 px-5 lg:px-8 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center">
            <span className="text-xl font-extrabold leading-none tracking-normal text-slate-950">
              PsiCoach<span className="ml-1 text-blue-600">AI</span>
            </span>
          </Link>

          <div className="flex items-center gap-5">
            <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors">Início</Link>
            <Link href="/login" className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors">Entrar</Link>
            <Link
              href="/cadastro"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-[11px] font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,0.28)] transition-all hover:-translate-y-0.5 hover:bg-blue-500"
            >
              Criar Conta
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl w-full mx-auto px-5 lg:px-8 py-16 lg:py-24 flex-1 space-y-14">
        <div className="text-center space-y-5 max-w-3xl mx-auto">
          <div className="section-badge mx-auto">
            <Sparkles className="w-3 h-3 text-blue-600" />
            <span>Planos</span>
          </div>
          <h1 className="page-headline">
            Invista na sua <span className="page-headline-accent">prática.</span>
          </h1>
          <p className="text-slate-500 text-[15px] leading-relaxed max-w-xl mx-auto">
            Economize em supervisões avulsas e tenha uma segunda opinião científica qualificada a qualquer hora.
          </p>

          <div className="inline-flex items-center rounded-full bg-blue-50 px-5 py-2 text-[11px] font-bold uppercase tracking-wider text-blue-700">
            Cobrança mensal
          </div>

          {planError && (
            <div className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
              {planError}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {/* Starter */}
          <div className="p-7 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between gap-6">
            <div className="space-y-5">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Para quem está começando</span>
                <h3 className="text-lg font-semibold text-slate-800">Starter</h3>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-light text-slate-900 tracking-tight">R$ 97</span>
                <span className="text-xs text-slate-400">/ mês</span>
              </div>
              <ul className="space-y-2.5 pt-2">
                {[
                  'Até 15 análises clínicas por mês',
                  'Mapa clínico com hipótese e plano imediato',
                  'Perguntas clínicas prontas para a sessão',
                  'Histórico de casos salvo',
                  'Diretriz teórica personalizável',
                ].map((it) => (
                  <li key={it} className="text-[13px] text-slate-600 flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => handleSelectPlan('starter')}
              disabled={selectingPlan !== null}
              className="w-full py-3 text-sm font-semibold rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-all"
            >
              {selectingPlan === 'starter' ? 'Salvando...' : 'Começar agora'}
            </button>
          </div>

          {/* Plus - highlighted */}
          <div className="p-7 rounded-3xl bg-white border-2 border-blue-500 shadow-[0_24px_48px_rgba(37,99,235,0.18)] flex flex-col justify-between gap-6 relative md:-mt-4">
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-bl-xl rounded-tr-3xl">Mais Popular</div>
            <div className="space-y-5">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Para clínicos em crescimento</span>
                </span>
                <h3 className="text-lg font-semibold text-slate-900">Plus</h3>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-light text-slate-900 tracking-tight">R$ 157</span>
                <span className="text-xs text-slate-400">/ mês</span>
              </div>
              <ul className="space-y-2.5 pt-2">
                <li className="text-[13px] text-slate-600 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Tudo do Starter</span>
                </li>
                {[
                  'Até 40 análises por mês',
                  'Análise de risco e proteção detalhada',
                  'Gerar nota de evolução automática',
                  'Gerar roteiro de perguntas',
                ].map((it) => (
                  <li key={it} className="text-[13px] text-slate-600 flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => handleSelectPlan('plus')}
              disabled={selectingPlan !== null}
              className="w-full py-3 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-[0_12px_28px_rgba(37,99,235,0.28)]"
            >
              {selectingPlan === 'plus' ? 'Salvando...' : 'Assinar Plus →'}
            </button>
          </div>

          {/* Pro */}
          <div className="p-7 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between gap-6">
            <div className="space-y-5">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Para clínicas e equipes</span>
                <h3 className="text-lg font-semibold text-slate-800">Pro</h3>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-light text-slate-900 tracking-tight">R$ 207</span>
                <span className="text-xs text-slate-400">/ mês</span>
              </div>
              <ul className="space-y-2.5 pt-2">
                <li className="text-[13px] text-slate-600 flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Tudo do Plus</span>
                </li>
                {[
                  'Análises ilimitadas',
                  'Múltiplas psicólogas na mesma conta',
                  'Referências bibliográficas por caso',
                  'Suporte prioritário',
                ].map((it) => (
                  <li key={it} className="text-[13px] text-slate-600 flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => handleSelectPlan('pro')}
              disabled={selectingPlan !== null}
              className="w-full py-3 text-sm font-semibold rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-all"
            >
              {selectingPlan === 'pro' ? 'Salvando...' : 'Assinar Pro'}
            </button>
          </div>
        </div>

        <div className="space-y-5 pt-8">
          <h2 className="text-center text-2xl font-light text-slate-800 tracking-tight flex items-center justify-center gap-2">
            <Coins className="w-5 h-5 text-blue-600" />
            <span>Comparativo <span className="font-semibold">completo</span></span>
          </h2>

          <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-white shadow-sm">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="text-slate-500 border-b border-slate-100 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="p-5">Funcionalidade</th>
                  <th className="p-5 text-center">Starter</th>
                  <th className="p-5 text-center text-blue-600">Plus</th>
                  <th className="p-5 text-center">Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {features.map((feat, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-5 font-medium text-slate-700">{feat.name}</td>
                    <td className="p-5 text-center text-slate-500">{feat.starter}</td>
                    <td className="p-5 text-center font-semibold text-blue-700">{feat.plus}</td>
                    <td className="p-5 text-center text-slate-500">{feat.pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="bg-[#f4f6f9] border-t border-slate-100 py-10 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-extrabold text-slate-900 text-sm">
            PsiCoach<span className="ml-1 text-blue-600">AI</span>
          </span>
          <div className="flex items-center gap-6">
            <span>© 2026 PsiCoach AI. Todos os direitos reservados.</span>
            <Link href="/" className="hover:text-slate-800">Início</Link>
            <Link href="/login" className="hover:text-slate-800">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
