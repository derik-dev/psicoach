'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { user, signIn } = useApp();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user) {
      if (user.onboardingCompleted) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding/perfil');
      }
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    const { error: authError } = await signIn(email, password);
    setLoading(false);

    if (authError) {
      setError('E-mail ou senha inválidos. Verifique suas credenciais.');
    }
  };

  const handleDemoFill = () => {
    setEmail('demo@psicoach.com.br');
    setPassword('demo123456');
  };

  return (
    <div className="bg-[#FAFBFD] text-slate-900 min-h-screen flex items-center justify-center p-5 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-sm p-8 lg:p-10 space-y-7">
        <div className="text-center space-y-4">
          <Link href="/" className="inline-flex items-center">
            <span className="text-xl font-extrabold leading-none tracking-normal text-slate-950">
              PsiCoach<span className="ml-1 text-blue-600">AI</span>
            </span>
          </Link>
          <h1 className="page-headline" style={{ fontSize: 'clamp(28px, 3.6vw, 40px)' }}>
            Bem-vinda de <span className="page-headline-accent">volta.</span>
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Insira suas credenciais para acessar seu copiloto clínico.
          </p>
        </div>

        {error && (
          <div className="px-4 py-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest block">E-mail Profissional</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dra.ana@psicoach.com.br"
                className="w-full bg-white border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest block">Senha</label>
              <Link href="#" className="text-[11px] text-blue-600 hover:text-blue-500 font-semibold">Esqueceu?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="w-full bg-white border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all shadow-[0_12px_28px_rgba(37,99,235,0.28)] hover:-translate-y-0.5"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Entrar</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="flex items-center gap-3">
          <div className="flex-grow border-t border-slate-100" />
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">Ou preencher demo</span>
          <div className="flex-grow border-t border-slate-100" />
        </div>

        <button
          onClick={handleDemoFill}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 font-semibold rounded-xl text-sm transition-all"
        >
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>Preencher com conta demo</span>
        </button>

        <p className="text-xs text-slate-500 text-center">
          Não tem uma conta?{' '}
          <Link href="/cadastro" className="font-semibold text-blue-600 hover:text-blue-500">Cadastre-se</Link>
        </p>
      </div>
    </div>
  );
}
