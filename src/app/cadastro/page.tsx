'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Brain, Lock, Mail, User, ShieldCheck, FileText, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const { user, setUser } = useApp();
  const router = useRouter();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [crp, setCrp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
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

  const handleSubmit = (e: React.FormEvent) => {
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

    if (!acceptTerms) {
      setError('Você precisa concordar com os Termos de Uso e Política de Privacidade.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      
      // Store basic profile in context with onboardingCompleted: false
      setUser({
        name,
        email,
        crp,
        onboardingCompleted: false,
        yearsExperience: '',
        patientTypes: [],
        specialties: [],
        mainApproach: '',
        approachDescription: '',
        responseDetail: 'detalhado'
      });

      router.push('/onboarding/perfil');
    }, 1500);
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 right-1/4 w-[350px] h-[350px] bg-indigo-650/10 rounded-full blur-[110px] -z-10" />

      <div className="w-full max-w-md bg-slate-900/30 border border-slate-800 rounded-3xl p-6 lg:p-8 backdrop-blur-xl space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shadow-lg">
              <Brain className="w-6 h-6 text-indigo-400" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-indigo-200 via-purple-300 to-indigo-200 bg-clip-text text-transparent">
              PsiCoach <span className="text-indigo-400 font-medium">AI</span>
            </span>
          </Link>
          <h2 className="text-base font-bold text-slate-200 pt-2">Crie sua credencial segura</h2>
          <p className="text-xs text-slate-500">Cadastre-se grátis para iniciar sua análise de casos.</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-450 rounded-xl text-xs text-center font-semibold animate-fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nome Completo</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Dra. Juliana Costa"
                className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-650 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">E-mail Profissional</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: juliana.psico@gmail.com"
                className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-650 outline-none transition-colors"
              />
            </div>
          </div>

          {/* CRP */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Número CRP (Inscrição no Conselho)</label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={crp}
                onChange={(e) => setCrp(e.target.value)}
                placeholder="Ex: 06/112932"
                className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-650 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Senha de Acesso</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-650 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Confirmar Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita sua senha"
                className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-650 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Checkbox */}
          <div className="flex items-start">
            <input
              id="terms"
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="w-4 h-4 text-indigo-600 border-slate-850 rounded focus:ring-indigo-500 bg-slate-950 mt-0.5"
            />
            <label htmlFor="terms" className="ml-2 text-[10px] text-slate-500 cursor-pointer leading-normal">
              Concordo com os{' '}
              <Link href="#" className="text-indigo-400 font-semibold hover:underline">Termos de Serviço</Link> e a{' '}
              <Link href="#" className="text-indigo-400 font-semibold hover:underline">Política de Privacidade</Link> sob os parâmetros de sigilo e criptografia LGPD do conselho.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-850 disabled:to-slate-850 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-650/15"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-indigo-200 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Cadastrar e Iniciar Onboarding</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-[11px] text-slate-500 text-center">
          Já possui um prontuário cadastrado?{' '}
          <Link href="/login" className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
