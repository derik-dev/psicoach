'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import {
  Sparkles,
  Plus,
  ArrowRight,
  ShieldCheck,
  FileText,
  Bookmark,
  Calendar,
  Layers,
  Heart,
  Quote
} from 'lucide-react';

const CLINICAL_TIPS = [
  'Lembre-se: em TCC, experimentos comportamentais contrastantes têm maior impacto emocional do que discussões puramente lógicas.',
  'Na Psicanálise, a resistência não é um erro do paciente, mas a própria manifestação do conflito inconsciente.',
  'Em casos de Luto Prolongado, a culpa paralisante frequentemente atua como uma âncora psíquica.',
  'Ao conduzir reexposições em TEPT, identifique e neutralize comportamentos de segurança ocultos.',
  'Metas realistas nas primeiras sessões de TCC previnem a autossabotagem e fortalecem a aliança terapêutica.',
  'Gestalt-terapia: foque no "como" e no "agora". A conscientização do mecanismo de contato é a chave.'
];

export default function Dashboard() {
  const { user, cases, activePlan, analysesUsed, analysesLimit } = useApp();
  const [tipIndex, setTipIndex] = React.useState(0);

  React.useEffect(() => {
    if (user) {
      const day = new Date().getDate();
      setTipIndex(day % CLINICAL_TIPS.length);
    }
  }, [user]);

  if (!user) return null;

  const totalCases = cases.length;
  const remaining = analysesLimit !== null ? Math.max(0, analysesLimit - analysesUsed) : 'Ilimitado';
  const recentCases = cases.slice(0, 3);

  const rotateTip = () => {
    setTipIndex((prev) => (prev + 1) % CLINICAL_TIPS.length);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="surface-card p-7 lg:p-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-4 max-w-2xl">
          <div className="section-badge">
            <Sparkles className="w-3 h-3 text-blue-600" />
            <span>Espaço Clínico</span>
          </div>
          <h1 className="page-headline">
            Bem-vinda, <span className="page-headline-accent">{user.name.split(' ')[0]}.</span>
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            Seu copiloto está ativo. Atualmente você possui <span className="font-semibold text-slate-800">{totalCases} prontuários</span> em seu histórico confidencial.
          </p>
        </div>

        <Link
          href="/nova-analise"
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-all shadow-[0_12px_28px_rgba(37,99,235,0.28)] hover:-translate-y-0.5 self-start shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Análise</span>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Consultas IA', value: analysesUsed, icon: FileText, sub: 'Total executadas', color: 'text-blue-600' },
          { label: 'Disponíveis', value: remaining, icon: Layers, sub: activePlan === 'starter' ? 'No plano mensal' : 'Plano Pro', color: 'text-emerald-500' },
          { label: 'Casos Salvos', value: totalCases, icon: Bookmark, sub: 'Sob sigilo', color: 'text-amber-500' },
          { label: 'Assinatura', value: 'Ativa', icon: Calendar, sub: 'Em dia', color: 'text-rose-400' }
        ].map(({ label, value, icon: Icon, sub, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{label}</span>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <span className="text-2xl font-light text-slate-900 tracking-tight">{value}</span>
              <p className="text-[10px] text-slate-400 font-medium mt-1">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Grid Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent cases */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-light text-slate-800 tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-blue-600" />
              <span>Dossiês <span className="font-semibold">recentes</span></span>
            </h2>
            <Link href="/historico" className="text-xs font-semibold text-blue-600 hover:text-blue-500 flex items-center gap-1">
              <span>Ver todos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentCases.length === 0 ? (
              <div className="p-10 rounded-3xl border border-dashed border-slate-200 text-center space-y-3 bg-white">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm text-slate-500">Nenhum caso salvo ainda.</p>
                <Link
                  href="/nova-analise"
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-xs font-semibold text-blue-700 transition-colors"
                >
                  Analisar primeiro caso
                </Link>
              </div>
            ) : (
              recentCases.map((c) => (
                <div
                  key={c.id}
                  className="group p-5 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 border border-blue-100 text-blue-700 uppercase">
                        {c.approach_used}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(c.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors truncate">
                      {c.title}
                    </h3>
                    <p className="text-[12px] text-slate-500 line-clamp-1 max-w-xl">{c.input_text}</p>
                  </div>

                  <Link
                    href={`/historico/${c.id}`}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 text-slate-600 hover:text-blue-700 rounded-xl text-xs font-semibold transition-all"
                  >
                    <span>Abrir</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar info */}
        <div className="space-y-5">
          <div className="surface-card p-6 space-y-4 relative overflow-hidden">
            <Quote className="absolute top-4 right-4 w-10 h-10 text-blue-100 rotate-180" />
            <div className="flex items-center justify-between relative">
              <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>Minuto Clínico</span>
              </span>
              <button onClick={rotateTip} className="text-[10px] font-semibold text-slate-400 hover:text-blue-600 uppercase tracking-wider transition-colors">
                Próxima →
              </button>
            </div>
            <p className="text-[13px] leading-relaxed text-slate-600 italic relative" style={{ fontFamily: 'Georgia, serif' }}>
              "{CLINICAL_TIPS[tipIndex]}"
            </p>
            <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              <span>PsiCoach AI</span>
              <span>{user.mainApproach.split(' ')[0]}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 flex gap-3 text-slate-600">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-800">Sigilo Ético</h4>
              <p className="text-[11px] leading-relaxed text-slate-500">
                Em conformidade com a LGPD. Todos os relatos passam por anonimização e criptografia ponta a ponta.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
