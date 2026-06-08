'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Lock, Mail, User, ArrowRight, CheckCircle } from 'lucide-react';
import { startCheckout } from '@/lib/stripe/client';
import { isPaidPlan } from '@/lib/stripe/config';
import { useSearchParams } from 'next/navigation';

export default function RegisterPage() {
  const { user, signUp, signInWithGoogle } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planFromUrl = searchParams.get('plan');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);

  React.useEffect(() => {
    if (user) {
      const pendingPlan = localStorage.getItem('pendingPlan');
      if (pendingPlan && isPaidPlan(pendingPlan)) {
        localStorage.removeItem('pendingPlan');
        startCheckout(pendingPlan);
        return;
      }
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

    if (!name || !email || !password || !confirmPassword) {
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
    const { error: authError, needsEmailConfirmation } = await signUp(name, email, password);
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
    }
    // If no email confirmation needed, the useEffect on `user` handles the redirect
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    const plan = planFromUrl || localStorage.getItem('pendingPlan');
    const redirectTo = plan
      ? `${window.location.origin}/auth/callback?plan=${plan}`
      : `${window.location.origin}/auth/callback`;
    const { error } = await signInWithGoogle(redirectTo);
    if (error) {
      setError('Não foi possível iniciar cadastro com Google. Tente novamente.');
      setGoogleLoading(false);
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
                <span>Criar conta</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="flex items-center gap-3">
          <div className="flex-grow border-t border-slate-100" />
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">Ou continue com</span>
          <div className="flex-grow border-t border-slate-100" />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full inline-flex items-center justify-center gap-3 px-6 py-3.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed text-slate-700 font-semibold rounded-xl text-sm transition-all"
        >
          {googleLoading ? (
            <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          <span>Entrar com Google</span>
        </button>

        <p className="text-xs text-slate-500 text-center">
          Já possui uma conta?{' '}
          <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
