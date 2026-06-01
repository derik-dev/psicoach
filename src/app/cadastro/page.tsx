'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Lock, Mail, User, ShieldCheck, ArrowRight, CheckCircle } from 'lucide-react';

<<<<<<< HEAD
export default function RegisterPage() {
  const { user, signUp } = useApp();
=======

export default function RegisterPage() {
  const { user, signUp, signInWithGoogle } = useApp();
>>>>>>> e70404a (chore: initial commit — projeto PsiCoach AI)
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [crp, setCrp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
<<<<<<< HEAD
=======
  const [googleLoading, setGoogleLoading] = useState(false);
>>>>>>> e70404a (chore: initial commit — projeto PsiCoach AI)
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);

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

    if (!name || !email || !crp || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (password !== confirmPassword) {
      setError('A confirmação de senha não coincide.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (!acceptTerms) {
      setError('Você precisa concordar com os Termos de Uso e Política de Privacidade.');
      return;
    }

    setLoading(true);
    const { error: authError, needsEmailConfirmation } = await signUp(name, email, crp, password);
    setLoading(false);

    if (authError) {
      if (authError.includes('already registered') || authError.includes('already been registered')) {
        setError('Este e-mail já está cadastrado. Tente fazer login.');
      } else {
        setError(authError);
      }
      return;
    }

    if (needsEmailConfirmation) {
      setEmailConfirmationSent(true);
    } else {
      router.push('/onboarding/perfil');
    }
  };

  if (emailConfirmationSent) {
    return (
      <div className="bg-[#FAFBFD] text-slate-900 min-h-screen flex items-center justify-center p-5 font-sans">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-sm p-8 lg:p-10 space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-800">Confirme seu e-mail</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Enviamos um link de confirmação para <strong className="text-slate-700">{email}</strong>. Clique no link para ativar sua conta.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-all"
          >
            Ir para o login
          </Link>
        </div>
      </div>
    );
  }

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
            Crie sua <span className="page-headline-accent">conta.</span>
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Cadastre-se grátis e comece a analisar seus primeiros casos.
          </p>
        </div>

        {error && (
          <div className="px-4 py-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest block">Nome Completo</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dra. Juliana Costa"
                className="w-full bg-white border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest block">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="juliana.psico@gmail.com"
                className="w-full bg-white border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest block">Número CRP</label>
            <div className="relative">
              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={crp}
                onChange={(e) => setCrp(e.target.value)}
                placeholder="06/112932"
                className="w-full bg-white border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest block">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mín. 6 caracteres"
                  className="w-full bg-white border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest block">Confirmar</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  className="w-full bg-white border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 pt-1">
            <input
              id="terms"
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 mt-0.5"
            />
            <label htmlFor="terms" className="text-[11px] text-slate-500 cursor-pointer leading-relaxed">
              Concordo com os{' '}
              <Link href="#" className="text-blue-600 font-semibold hover:underline">Termos de Serviço</Link> e a{' '}
              <Link href="#" className="text-blue-600 font-semibold hover:underline">Política de Privacidade</Link>, em conformidade com a LGPD.
            </label>
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
                <span>Criar conta e iniciar onboarding</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-xs text-slate-500 text-center">
          Já possui uma conta?{' '}
          <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
