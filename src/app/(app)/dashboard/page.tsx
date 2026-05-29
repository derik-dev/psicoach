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
  "Lembre-se: Em TCC, experimentos comportamentais contrastantes têm maior impacto emocional e eficácia na reestruturação cognitiva do que discussões puramente lógicas.",
  "Na Psicanálise, a resistência não é um erro do paciente, mas a própria manifestação do conflito inconsciente. Deve ser integrada e analisada, não confrontada precipitadamente.",
  "Em casos de Luto Prolongado, a culpa paralisante frequentemente atua como uma âncora psíquica para manter a ilusão de controle e conexão com o falecido. Explore a ambivalência da relação.",
  "Ao conduzir reexposições em traumas/TEPT, certifique-se de identificar e neutralizar os comportamentos de segurança ocultos (como prender a respiração ou desviar o olhar).",
  "O estabelecimento de metas realistas nas primeiras sessões de TCC previne a autossabotagem e fortalece a aliança terapêutica. Divida o problema maior em micrometas operacionais.",
  "Gestalt-terapia: Foque no 'como' e no 'agora'. A conscientização sobre o mecanismo de contato que está interrompendo o ciclo de experiência é a chave para a autorregulação orgânica."
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
    <div className="space-y-8 animate-premium-fade">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#120e19] via-[#181422] to-[#09070c] border border-[#b18cf2]/10 p-6 lg:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#b18cf2]/5 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDuration: '10s' }} />
        <div className="absolute bottom-0 right-10 w-72 h-72 bg-[#db7b63]/5 rounded-full blur-[80px] animate-pulse-glow" style={{ animationDuration: '6s' }} />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#b18cf2]/10 border border-[#b18cf2]/15 text-[10px] font-bold text-[#b18cf2] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#db7b63] animate-pulse" />
              <span>Espaço Clínico Seguro</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight font-serif-clinical italic text-[#f5f2eb]">
              Bem-vinda de volta, Dra. {user.name.split(' ')[0]}
            </h1>
            <p className="text-[#b4aebd] text-xs sm:text-sm max-w-xl leading-relaxed">
              Seu copiloto científico está ativo e pronto. Atualmente, você possui <span className="text-[#b18cf2] font-bold">{totalCases} prontuários clínicos</span> salvos em seu histórico confidencial.
            </p>
          </div>
          
          <Link
            href="/nova-analise"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#a274eb] to-[#db7b63] hover:opacity-95 text-[#09070c] font-bold text-xs rounded-2xl transition-all duration-300 shadow-xl shadow-[#a274eb]/20 shrink-0 self-start lg:self-center"
          >
            <Plus className="w-4 h-4 text-[#09070c]" />
            <span>Nova Análise Clínica</span>
          </Link>
        </div>
      </div>

      {/* Grid Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="p-5 rounded-2xl bg-[#120e19]/45 border border-[#b18cf2]/5 flex flex-col justify-between h-28 shadow-sm">
          <div className="flex items-center justify-between text-[#736c7e]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Consultas AI</span>
            <FileText className="w-4 h-4 text-[#b18cf2]" />
          </div>
          <div>
            <span className="text-xl lg:text-2xl font-black text-[#f5f2eb]">{analysesUsed}</span>
            <p className="text-[9px] text-[#736c7e] font-semibold mt-1">Total de análises executadas</p>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="p-5 rounded-2xl bg-[#120e19]/45 border border-[#b18cf2]/5 flex flex-col justify-between h-28 shadow-sm">
          <div className="flex items-center justify-between text-[#736c7e]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Disponíveis</span>
            <Layers className="w-4 h-4 text-[#db7b63]" />
          </div>
          <div>
            <span className="text-xl lg:text-2xl font-black text-[#f5f2eb]">{remaining}</span>
            <p className="text-[9px] text-[#736c7e] font-semibold mt-1">
              {activePlan === 'starter' ? 'No plano mensal' : 'Acesso ilimitado Pro'}
            </p>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="p-5 rounded-2xl bg-[#120e19]/45 border border-[#b18cf2]/5 flex flex-col justify-between h-28 shadow-sm">
          <div className="flex items-center justify-between text-[#736c7e]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Casos Salvos</span>
            <Bookmark className="w-4 h-4 text-[#7da893]" />
          </div>
          <div>
            <span className="text-xl lg:text-2xl font-black text-[#f5f2eb]">{totalCases}</span>
            <p className="text-[9px] text-[#736c7e] font-semibold mt-1">Armazenamento sob sigilo</p>
          </div>
        </div>

        {/* Stat 4 */}
        <div className="p-5 rounded-2xl bg-[#120e19]/45 border border-[#b18cf2]/5 flex flex-col justify-between h-28 shadow-sm">
          <div className="flex items-center justify-between text-[#736c7e]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Assinatura</span>
            <Calendar className="w-4 h-4 text-amber-500/80" />
          </div>
          <div>
            <span className="text-xl lg:text-2xl font-black text-[#f5f2eb]">Ativa</span>
            <p className="text-[9px] text-[#736c7e] font-semibold mt-1">Conformidade e faturamento em dia</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Cases Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold uppercase tracking-wider text-[#f5f2eb] flex items-center gap-2">
              <span className="w-1.5 h-4.5 rounded-full bg-[#b18cf2]" />
              <span>Dossiês Recentes</span>
            </h2>
            <Link
              href="/historico"
              className="text-xs font-bold text-[#b18cf2] hover:text-[#db7b63] flex items-center gap-1 transition-colors"
            >
              <span>Ver todos os prontuários</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentCases.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-[#b18cf2]/10 text-center space-y-3 bg-[#120e19]/20">
                <FileText className="w-8 h-8 text-[#736c7e] mx-auto animate-pulse" />
                <p className="text-xs text-[#b4aebd]">Nenhum relato de caso salvo ou analisado.</p>
                <Link
                  href="/nova-analise"
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-[#181422] hover:bg-[#b18cf2]/10 text-xs font-semibold text-[#b18cf2] transition-colors border border-[#b18cf2]/10"
                >
                  <span>Analisar primeiro relato</span>
                </Link>
              </div>
            ) : (
              recentCases.map((c) => (
                <div
                  key={c.id}
                  className="group relative p-5 rounded-2xl bg-[#120e19]/45 hover:bg-[#181422]/65 border border-[#b18cf2]/5 hover:border-[#b18cf2]/20 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-[#b18cf2]/10 border border-[#b18cf2]/20 text-[#b18cf2] uppercase">
                        {c.approach_used}
                      </span>
                      <span className="text-[9px] text-[#736c7e] font-bold">
                        {new Date(c.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                        })}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-[#f5f2eb] group-hover:text-[#b18cf2] transition-colors truncate">
                      {c.title}
                    </h3>
                    <p className="text-xs text-[#b4aebd] line-clamp-1 max-w-xl">
                      {c.input_text}
                    </p>
                  </div>
                  
                  <Link
                    href={`/historico/${c.id}`}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#09070c] hover:bg-[#b18cf2]/10 border border-[#b18cf2]/10 hover:border-[#b18cf2]/30 text-[#b4aebd] hover:text-[#b18cf2] rounded-xl text-xs font-semibold transition-all duration-200"
                  >
                    <span>Abrir Dossiê</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar Info Section */}
        <div className="space-y-6">
          {/* Tip of the Day Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-b from-[#120e19] to-[#09070c] border border-[#b18cf2]/5 shadow-xl flex flex-col justify-between space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 text-[#b18cf2]/10">
              <Quote className="w-12 h-12 rotate-180" />
            </div>
            
            <div className="flex items-center justify-between relative z-10">
              <span className="text-[10px] font-bold text-[#b18cf2] uppercase tracking-widest flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-[#db7b63]" />
                <span>Minuto de Atenção Clínica</span>
              </span>
              <button
                onClick={rotateTip}
                className="text-[9px] font-bold text-[#736c7e] hover:text-[#b18cf2] uppercase tracking-wider transition-colors"
              >
                Próxima →
              </button>
            </div>
            
            <p className="text-xs leading-relaxed text-[#b4aebd] italic font-serif-clinical">
              "{CLINICAL_TIPS[tipIndex]}"
            </p>
            
            <div className="border-t border-[#b18cf2]/5 pt-3.5 flex items-center justify-between text-[9px] text-[#736c7e] font-semibold uppercase tracking-wider relative z-10">
              <span>PsiCoach AI sanctuary</span>
              <span>Para {user.mainApproach.split(' ')[0]}</span>
            </div>
          </div>

          {/* Quick Support / HIPAA GDPR compliance notice */}
          <div className="p-5 rounded-2xl bg-[#120e19]/15 border border-[#b18cf2]/5 flex gap-3 text-[#b4aebd] shadow-sm">
            <ShieldCheck className="w-5 h-5 text-[#7da893] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-[#f5f2eb]">Sigilo Ético Assegurado</h4>
              <p className="text-[10px] leading-relaxed text-[#736c7e] font-medium">
                Em conformidade com a LGPD e parâmetros éticos. Todos os prontuários e relatos passam por processo de anonimização total na API criptografada.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
