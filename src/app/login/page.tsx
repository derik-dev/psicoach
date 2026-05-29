'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Brain, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { user, setUser } = useApp();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);

    // Simulate database login delay
    setTimeout(() => {
      setLoading(false);
      
      // Auto-login with mock session
      setUser({
        name: 'Dra. Ana Paula Silveira',
        email: email,
        crp: '06/120934',
        onboardingCompleted: true,
        yearsExperience: '3-5',
        patientTypes: ['adultos', 'adolescentes'],
        specialties: ['ansiedade', 'trauma'],
        mainApproach: 'TCC (Terapia Cognitivo-Comportamental)',
        approachDescription: '',
        responseDetail: 'detalhado'
      });
      router.push('/dashboard');
    }, 1200);
  };

  const handleDemoLogin = () => {
    setEmail('dra.ana@psicoach.com.br');
    setPassword('123456');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setUser({
        name: 'Dra. Ana Paula Silveira',
        email: 'dra.ana@psicoach.com.br',
        crp: '06/120934',
        onboardingCompleted: true,
        yearsExperience: '3-5',
        patientTypes: ['adultos', 'adolescentes'],
        specialties: ['ansiedade', 'trauma'],
        mainApproach: 'TCC (Terapia Cognitivo-Comportamental)',
        approachDescription: '',
        responseDetail: 'detalhado'
      });
      router.push('/dashboard');
    }, 800);
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-indigo-650/10 rounded-full blur-[100px] -z-10" />
      
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
          <h2 className="text-base font-bold text-slate-200 pt-2">Seja bem-vinda de volta</h2>
          <p className="text-xs text-slate-500">Insira suas credenciais para acessar o prontuário.</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-450 rounded-xl text-xs text-center font-semibold animate-fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="Ex: dra.ana@psicoach.com.br"
                className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-650 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Senha</label>
              <Link href="#" className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors font-semibold">Esqueceu a senha?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-650 outline-none transition-colors"
              />
            </div>
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
                <span>Entrar no Painel</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-850"></div>
          <span className="flex-shrink mx-3 text-[10px] text-slate-600 font-bold uppercase tracking-wider">Ou teste rápido</span>
          <div className="flex-grow border-t border-slate-850"></div>
        </div>

        {/* Demo fast access */}
        <button
          onClick={handleDemoLogin}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-350 hover:text-slate-100 font-semibold rounded-xl text-xs transition-all"
        >
          <Sparkles className="w-4.5 h-4.5 text-indigo-400" />
          <span>Acesso Rápido de Demonstração</span>
        </button>

        <p className="text-[11px] text-slate-500 text-center">
          Não tem uma conta cadastrada?{' '}
          <Link href="/cadastro" className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors">Cadastre-se</Link>
        </p>
      </div>
    </div>
  );
}
