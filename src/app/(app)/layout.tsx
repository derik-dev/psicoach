'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  LayoutDashboard,
  PlusCircle,
  FolderHeart,
  BookOpen,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  Lock
} from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, activePlan, analysesUsed, analysesLimit, logout } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  React.useEffect(() => {
    if (!user) {
      router.push('/login');
    } else if (!user.onboardingCompleted) {
      router.push('/onboarding/perfil');
    }
  }, [user, router]);

  if (!user || !user.onboardingCompleted) {
    return null;
  }

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Nova Análise', href: '/nova-analise', icon: PlusCircle, highlight: true },
    { name: 'Histórico', href: '/historico', icon: FolderHeart },
    { name: 'Biblioteca', href: '/biblioteca', icon: BookOpen },
    { name: 'Configurações', href: '/configuracoes', icon: Settings }
  ];

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const remaining = analysesLimit !== null ? Math.max(0, analysesLimit - analysesUsed) : null;
  const percentage = analysesLimit !== null ? (analysesUsed / analysesLimit) * 100 : 0;

  return (
    <div className="flex min-h-screen bg-[#f4f6f9] text-slate-900 font-sans selection:bg-blue-600/10 selection:text-blue-700">
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-100 px-5 flex items-center justify-between z-30">
        <Link href="/dashboard" className="inline-flex items-center">
          <span className="text-base font-extrabold leading-none text-slate-950">
            PsiCoach<span className="ml-1 text-blue-600">AI</span>
          </span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 z-20 transition-transform duration-300
        lg:translate-x-0 lg:static lg:h-screen lg:flex
        ${mobileMenuOpen ? 'translate-x-0 pt-20' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="m-4 lg:my-4 lg:ml-4 w-[calc(100%-2rem)] lg:w-60 bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex flex-col h-[calc(100vh-2rem)]">
          {/* Logo */}
          <div className="hidden lg:flex items-center mb-7 px-2">
            <span className="text-lg font-extrabold leading-none tracking-normal text-slate-950">
              PsiCoach<span className="ml-1 text-blue-600">AI</span>
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-[13px] font-medium ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)]'
                      : item.highlight
                        ? 'text-blue-700 bg-blue-50 hover:bg-blue-100'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                  {item.highlight && !isActive && (
                    <Sparkles className="w-3.5 h-3.5 text-blue-500 ml-auto" />
                  )}
                </Link>
              );
            })}

            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-[13px] font-medium mt-3 ${
                pathname === '/admin' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Painel Admin</span>
            </Link>
          </nav>

          {/* Usage card */}
          <div className="mt-4 mb-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Plano <span className="text-blue-600 capitalize">{activePlan}</span>
              </span>
              {remaining !== null && (
                <span className="text-[10px] font-semibold text-slate-500">{remaining} restantes</span>
              )}
            </div>
            {analysesLimit !== null ? (
              <div className="space-y-2">
                <div className="w-full bg-white rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${Math.min(100, percentage)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 text-center font-medium">
                  {analysesUsed} de {analysesLimit} análises
                </p>
                {remaining !== null && remaining <= 3 && (
                  <Link
                    href="/pricing"
                    className="block text-center text-[11px] font-semibold text-blue-600 hover:text-blue-500 mt-1"
                  >
                    Liberar ilimitado →
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] text-slate-700 font-medium">Ilimitado ativo</span>
              </div>
            )}
          </div>

          {/* User card */}
          <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[12px] font-semibold truncate text-slate-800">{user.name}</span>
                <span className="text-[10px] text-slate-400 truncate">CRP {user.crp}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sair"
              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <main className="flex-1 p-5 lg:p-8 pt-20 lg:pt-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
