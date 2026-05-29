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
  Brain,
  Sparkles,
  Lock,
  ChevronRight,
  Sparkle
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
    { name: 'Histórico de Casos', href: '/historico', icon: FolderHeart },
    { name: 'Biblioteca Clínica', href: '/biblioteca', icon: BookOpen },
    { name: 'Configurações', href: '/configuracoes', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const remaining = analysesLimit !== null ? Math.max(0, analysesLimit - analysesUsed) : null;
  const percentage = analysesLimit !== null ? (analysesUsed / analysesLimit) * 100 : 0;

  return (
    <div className="flex min-h-screen bg-[#09070c] text-[#f5f2eb] font-sans antialiased selection:bg-[#b18cf2]/30 selection:text-white">
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#120e19]/90 backdrop-blur-xl border-b border-[#b18cf2]/10 px-4 flex items-center justify-between z-30 shadow-md">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-[#b18cf2]/10 border border-[#b18cf2]/20 flex items-center justify-center">
            <Brain className="w-5 h-5 text-[#b18cf2]" />
          </div>
          <span className="font-bold text-sm tracking-tight font-serif-clinical italic text-[#f5f2eb]">
            PsiCoach <span className="text-[#b18cf2] font-sans font-semibold not-italic">AI</span>
          </span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-[#b4aebd] hover:text-[#f5f2eb] hover:bg-[#181422]/60 rounded-xl transition-all"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar - Desktop */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-[#120e19]/45 border-r border-[#b18cf2]/5 p-6 flex flex-col z-20 transition-transform duration-300 backdrop-blur-2xl
        lg:translate-x-0 lg:static lg:h-screen lg:flex
        ${mobileMenuOpen ? 'translate-x-0 pt-20' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="hidden lg:flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-2xl bg-[#b18cf2]/15 border border-[#b18cf2]/25 flex items-center justify-center shadow-[0_0_20px_rgba(177,140,242,0.12)]">
            <Brain className="w-5.5 h-5.5 text-[#b18cf2] animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight font-serif-clinical italic text-[#f5f2eb] leading-tight">
              PsiCoach <span className="text-[#b18cf2] font-sans font-semibold not-italic">AI</span>
            </span>
            <span className="text-[9px] text-[#db7b63] uppercase tracking-widest font-bold font-sans-ui mt-0.5">Clinical Sanctuary</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center justify-between px-3.5 py-3 rounded-2xl transition-all duration-300 group
                  ${isActive
                    ? item.highlight
                      ? 'bg-gradient-to-r from-[#a274eb] to-[#db7b63] text-[#09070c] font-bold shadow-[0_4px_20px_rgba(162,116,235,0.25)]'
                      : 'bg-[#181422] text-[#f5f2eb] border-l-2 border-[#b18cf2] pl-3'
                    : item.highlight
                      ? 'bg-[#b18cf2]/10 hover:bg-[#b18cf2]/20 text-[#b18cf2] border border-[#b18cf2]/20'
                      : 'text-[#b4aebd] hover:text-[#f5f2eb] hover:bg-[#181422]/40'
                  }
                `}
              >
                <div className="flex items-center gap-3.5">
                  <item.icon className={`w-4.5 h-4.5 transition-transform duration-300 group-hover:scale-105 ${isActive ? 'text-current' : 'text-[#b4aebd] group-hover:text-[#b18cf2]'}`} />
                  <span className="text-[12.5px] font-semibold tracking-wide">{item.name}</span>
                </div>
                {item.highlight && !isActive && (
                  <Sparkle className="w-3.5 h-3.5 text-[#db7b63] animate-pulse" />
                )}
                {isActive && !item.highlight && (
                  <ChevronRight className="w-3.5 h-3.5 text-[#b18cf2]/80" />
                )}
              </Link>
            );
          })}

          {/* Admin shortcut */}
          <Link
            href="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className={`
              flex items-center gap-3.5 px-3.5 py-3 rounded-2xl transition-all duration-300 text-[#736c7e] hover:text-[#b4aebd] hover:bg-[#181422]/20
              ${pathname === '/admin' ? 'bg-[#181422] text-[#f5f2eb] border-l-2 border-[#736c7e] pl-3' : ''}
            `}
          >
            <Lock className="w-4.5 h-4.5" />
            <span className="text-[12.5px] font-semibold tracking-wide">Painel Admin</span>
          </Link>
        </nav>

        {/* Usage Limits Card */}
        <div className="mt-auto mb-6 p-4 rounded-2xl bg-[#120e19]/60 border border-[#b18cf2]/5 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] text-[#b4aebd] font-bold uppercase tracking-wider">
              Plano <span className="text-[#b18cf2]">{activePlan}</span>
            </span>
            {remaining !== null && (
              <span className="text-[10px] text-[#db7b63] font-bold uppercase">
                {remaining} restantes
              </span>
            )}
          </div>
          {analysesLimit !== null ? (
            <div className="space-y-2">
              <div className="w-full bg-[#181422] rounded-full h-1 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#b18cf2] to-[#db7b63]"
                  style={{ width: `${Math.min(100, percentage)}%` }}
                />
              </div>
              <p className="text-[9px] text-[#736c7e] text-center font-medium">
                Prontuário: {analysesUsed} de {analysesLimit} análises feitas
              </p>
              {remaining !== null && remaining <= 3 && (
                <Link
                  href="/pricing"
                  className="block text-center text-[10px] font-bold text-[#b18cf2] hover:text-[#db7b63] transition-colors mt-2"
                >
                  Liberar Acesso Ilimitado →
                </Link>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
              <span className="text-[10px] text-[#f5f2eb]/90 font-medium">Consultas ilimitadas ativas!</span>
            </div>
          )}
        </div>

        {/* User Card */}
        <div className="border-t border-[#b18cf2]/5 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#b18cf2] to-[#db7b63] flex items-center justify-center text-[#09070c] font-black text-xs shrink-0 shadow-md">
              {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold truncate text-[#f5f2eb]">{user.name}</span>
              <span className="text-[9px] text-[#736c7e] font-semibold truncate">CRP {user.crp}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sair do Sistema"
            className="p-2 text-[#736c7e] hover:text-[#db7b63] hover:bg-[#db7b63]/10 rounded-xl transition-all shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <main className="flex-1 p-4 lg:p-8 pt-20 lg:pt-8 max-w-7xl w-full mx-auto animate-premium-fade">
          {children}
        </main>
      </div>
    </div>
  );
}
