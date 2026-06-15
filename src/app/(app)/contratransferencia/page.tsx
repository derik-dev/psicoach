'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import {
  Activity,
  ArrowRight,
  Eye,
  Target,
  MessageSquare,
  BookOpen,
  AlertTriangle,
  Clock,
  FolderHeart,
} from 'lucide-react';

interface CtAnalysis {
  id: string;
  case_id: string;
  created_at: string;
  sentimento_durante: string;
  resultado: {
    padrao_identificado: string;
    impacto_no_caso: string;
    o_que_observar: string[];
    pergunta_reflexiva: string;
    nivel_processo: 'leve' | 'atencao' | 'significativo';
    referencia: string;
  };
  cases: {
    title: string;
    approach_used: string;
  } | null;
}

const nivelConfig = {
  leve: { label: 'Processo leve', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  atencao: { label: 'Atenção ao processo', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  significativo: { label: 'Processo significativo', color: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export default function ContratransferenciaPage() {
  const [analyses, setAnalyses] = useState<CtAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('contratransference_analyses')
      .select('*, cases(title, approach_used)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setAnalyses((data as CtAnalysis[]) || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-light tracking-tight text-slate-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-violet-500" />
            Contratransferência
          </h1>
          <p className="text-xs text-slate-500">
            Registro das suas análises de processos internos por sessão.
          </p>
        </div>
      </div>

      {loading && (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white rounded-3xl border border-slate-100" />
          ))}
        </div>
      )}

      {!loading && analyses.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center">
            <Activity className="w-6 h-6 text-violet-400" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-700">Nenhuma análise ainda</p>
            <p className="text-xs text-slate-400 max-w-xs">
              Acesse um caso em Histórico e clique em &ldquo;Analisar minha contratransferência&rdquo;.
            </p>
          </div>
          <Link
            href="/historico"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            <FolderHeart className="w-3.5 h-3.5" />
            <span>Ir para Histórico</span>
          </Link>
        </div>
      )}

      {!loading && analyses.length > 0 && (
        <div className="space-y-3">
          {analyses.map((a) => {
            const nivel = nivelConfig[a.resultado.nivel_processo] ?? nivelConfig.leve;
            const isOpen = expanded === a.id;

            return (
              <div
                key={a.id}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
              >
                {/* Card header */}
                <button
                  onClick={() => setExpanded(isOpen ? null : a.id)}
                  className="w-full p-5 flex items-start gap-4 text-left hover:bg-slate-50/50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                    <Activity className="w-4.5 h-4.5 text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${nivel.color}`}>
                        {nivel.label}
                      </span>
                      {a.cases && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 border border-blue-100 text-blue-700 uppercase tracking-wider truncate max-w-[140px]">
                          {a.cases.approach_used}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {a.cases?.title ?? 'Caso sem título'}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-1">
                      {a.resultado.padrao_identificado}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(a.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <ArrowRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                  </div>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t border-slate-100 p-5 space-y-4">
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                        <Eye className="w-3 h-3 text-violet-500" />
                        Padrão identificado
                      </p>
                      <p className="text-xs leading-relaxed text-slate-700 p-4 bg-violet-50/50 border border-violet-100 rounded-2xl">
                        {a.resultado.padrao_identificado}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                        <Target className="w-3 h-3 text-violet-500" />
                        Como pode estar afetando o caso
                      </p>
                      <p className="text-xs leading-relaxed text-slate-700 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                        {a.resultado.impacto_no_caso}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                        O que observar na próxima sessão
                      </p>
                      <div className="space-y-1.5">
                        {a.resultado.o_que_observar.map((item, idx) => (
                          <div key={idx} className="flex gap-2.5 p-3 bg-amber-50/60 border border-amber-100 rounded-xl text-xs text-slate-700">
                            <span className="w-4 h-4 rounded-full bg-amber-400 text-white flex items-center justify-center font-semibold shrink-0 text-[9px]">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                        <MessageSquare className="w-3 h-3 text-violet-500" />
                        Pergunta reflexiva
                      </p>
                      <p className="text-xs leading-relaxed text-slate-700 p-4 bg-violet-50/30 border border-violet-100 rounded-2xl italic border-l-4 border-l-violet-400" style={{ fontFamily: 'Georgia, serif' }}>
                        &ldquo;{a.resultado.pergunta_reflexiva}&rdquo;
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                        <BookOpen className="w-3 h-3 text-violet-500" />
                        Referência
                      </p>
                      <p className="text-xs text-slate-600 p-3 bg-slate-50 border border-slate-100 rounded-xl leading-relaxed">
                        {a.resultado.referencia}
                      </p>
                    </div>

                    <div className="pt-1">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Como você se sentiu</p>
                      <p className="text-xs text-slate-600 italic leading-relaxed">&ldquo;{a.sentimento_durante}&rdquo;</p>
                    </div>

                    {a.cases && (
                      <Link
                        href={`/historico/${a.case_id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-700 hover:bg-violet-50 rounded-xl text-[11px] font-semibold transition-all"
                      >
                        <FolderHeart className="w-3.5 h-3.5" />
                        <span>Ver caso completo</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
