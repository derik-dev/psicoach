'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useApp, CaseAnalysis, AttentionHistoryEntry } from '@/context/AppContext';
import { supabase } from '@/lib/supabase/client';
import { appendUnique, extractFirstParagraph, extractFirstSentence } from '@/lib/memory-utils';
import {
  FolderHeart,
  Search,
  Filter,
  Plus,
  ArrowRight,
  Trash2,
  Calendar,
  Tag,
  User,
  Link2,
  Link2Off,
  ChevronDown,
  X,
  Check,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';

export default function CaseHistory() {
  const { cases, deleteCase, patients, updateCase } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [approachFilter, setApproachFilter] = useState('All');
  const [tagFilter, setTagFilter] = useState('All');
  const [showChats, setShowChats] = useState(false);
  const [linkingCaseId, setLinkingCaseId] = useState<string | null>(null);
  const [linkingLoading, setLinkingLoading] = useState(false);
  const [confirmUnlink, setConfirmUnlink] = useState<{ caseId: string; patientName: string } | null>(null);
  const [relinkingCaseId, setRelinkingCaseId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setLinkingCaseId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const uniqueApproaches = useMemo(() => {
    const approaches = new Set<string>();
    cases.forEach((c) => {
      if (c.approach_used) approaches.add(c.approach_used);
    });
    return Array.from(approaches);
  }, [cases]);

  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    cases.forEach((c) => {
      if (c.tags) c.tags.forEach((t) => tags.add(t));
    });
    return Array.from(tags);
  }, [cases]);

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const isChat = c.approach_used === 'Chat' || (c.tags && c.tags.includes('chat'));
      if (isChat && !showChats) return false;

      const matchesSearch =
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.input_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.notes && c.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesApproach =
        approachFilter === 'All' || c.approach_used === approachFilter;

      const matchesTag =
        tagFilter === 'All' || (c.tags && c.tags.includes(tagFilter));

      return matchesSearch && matchesApproach && matchesTag;
    });
  }, [cases, searchTerm, approachFilter, tagFilter, showChats]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setApproachFilter('All');
    setTagFilter('All');
  };

  const handleLinkPatient = async (caseId: string, patientId: string) => {
    setLinkingLoading(true);
    try {
      const { data: existingSessions } = await supabase
        .from('sessions')
        .select('id')
        .eq('patient_id', patientId);

      const nextSessionNumber = (existingSessions?.length || 0) + 1;

      const clinicalCase = cases.find(c => c.id === caseId);
      const nivel = clinicalCase?.analysis?.nivel_atencao || 'baixo';

      const { data: newSession } = await supabase
        .from('sessions')
        .insert({
          patient_id: patientId,
          analysis_id: caseId,
          session_number: nextSessionNumber,
          therapist_notes: '',
        })
        .select('id')
        .single();

      void newSession;

      const { data: existingMemory } = await supabase
        .from('patient_memory')
        .select('id, attention_history')
        .eq('patient_id', patientId)
        .single();

      const newEntry = {
        date: clinicalCase?.created_at || new Date().toISOString(),
        level: nivel,
        session_number: nextSessionNumber,
      };

      if (existingMemory) {
        const history = (existingMemory.attention_history as typeof newEntry[]) || [];
        await supabase
          .from('patient_memory')
          .update({ attention_history: [...history, newEntry], updated_at: new Date().toISOString() })
          .eq('patient_id', patientId);
      } else {
        await supabase
          .from('patient_memory')
          .insert({ patient_id: patientId, attention_history: [newEntry] });
      }

      await updateCase(caseId, { patient_id: patientId, session_number: nextSessionNumber });
      setLinkingCaseId(null);
    } catch (err) {
      console.error('Erro ao vincular caso:', err);
    } finally {
      setLinkingLoading(false);
    }
  };

  const rebuildPatientMemory = async (patientId: string) => {
    const { data: sessData } = await supabase
      .from('sessions')
      .select('analysis_id, session_number, created_at')
      .eq('patient_id', patientId)
      .not('analysis_id', 'is', null)
      .order('session_number', { ascending: true });

    const emptyPayload = {
      confirmed_hypotheses: [] as string[],
      recurring_patterns: [] as string[],
      central_themes: [] as string[],
      attention_history: [] as AttentionHistoryEntry[],
      updated_at: new Date().toISOString(),
    };

    if (!sessData?.length) {
      await supabase.from('patient_memory').update(emptyPayload).eq('patient_id', patientId);
      return;
    }

    const analysisIds = sessData.map(s => s.analysis_id as string);
    const { data: casesData } = await supabase
      .from('cases').select('id, analysis, created_at').in('id', analysisIds);

    if (!casesData) return;

    let confirmedHyps: string[] = [];
    let patterns: string[] = [];
    let themes: string[] = [];
    const attHistory: AttentionHistoryEntry[] = [];
    const caseMap = new Map(casesData.map(c => [c.id as string, c]));

    for (const sess of sessData) {
      const caseData = caseMap.get(sess.analysis_id as string);
      if (!caseData) continue;
      const analysis = caseData.analysis as CaseAnalysis & { hipotese_central?: string; fatores_relevantes?: string[]; sintese?: string };

      const hyp = extractFirstParagraph(analysis.hipotese_central || analysis.hypothesis || '');
      if (hyp) confirmedHyps = appendUnique(confirmedHyps, [hyp]);

      const factors = (analysis.fatores_relevantes || []).map(f => f.trim()).filter(Boolean);
      patterns = appendUnique(patterns, factors);

      const theme = extractFirstSentence(analysis.sintese || '');
      if (theme) themes = appendUnique(themes, [theme]);

      attHistory.push({
        date: caseData.created_at as string,
        level: (analysis.nivel_atencao || 'baixo') as AttentionHistoryEntry['level'],
        session_number: sess.session_number as number,
      });
    }

    const payload = {
      confirmed_hypotheses: confirmedHyps,
      recurring_patterns: patterns,
      central_themes: themes,
      attention_history: attHistory,
      updated_at: new Date().toISOString(),
    };

    const { data: existingMem } = await supabase
      .from('patient_memory').select('id').eq('patient_id', patientId).single();

    if (existingMem) {
      await supabase.from('patient_memory').update(payload).eq('patient_id', patientId);
    } else {
      await supabase.from('patient_memory').insert({ patient_id: patientId, ...payload });
    }
  };

  const handleRelinkPatient = async (caseId: string, oldPatientId: string, newPatientId: string) => {
    setLinkingLoading(true);
    try {
      await supabase.from('sessions').delete()
        .eq('patient_id', oldPatientId).eq('analysis_id', caseId);
      await rebuildPatientMemory(oldPatientId);

      const { data: existingSessions } = await supabase
        .from('sessions').select('id').eq('patient_id', newPatientId);
      const nextSessionNumber = (existingSessions?.length || 0) + 1;
      const clinicalCase = cases.find(cc => cc.id === caseId);
      const nivel = clinicalCase?.analysis?.nivel_atencao || 'baixo';

      await supabase.from('sessions').insert({
        patient_id: newPatientId,
        analysis_id: caseId,
        session_number: nextSessionNumber,
        therapist_notes: '',
      });

      const { data: existingMemory } = await supabase
        .from('patient_memory').select('id, attention_history').eq('patient_id', newPatientId).single();
      const newEntry = {
        date: clinicalCase?.created_at || new Date().toISOString(),
        level: nivel,
        session_number: nextSessionNumber,
      };

      if (existingMemory) {
        const history = (existingMemory.attention_history as typeof newEntry[]) || [];
        await supabase.from('patient_memory')
          .update({ attention_history: [...history, newEntry], updated_at: new Date().toISOString() })
          .eq('patient_id', newPatientId);
      } else {
        await supabase.from('patient_memory').insert({ patient_id: newPatientId, attention_history: [newEntry] });
      }

      await updateCase(caseId, { patient_id: newPatientId, session_number: nextSessionNumber });
      setLinkingCaseId(null);
      setRelinkingCaseId(null);
    } catch (err) {
      console.error('Erro ao revincular caso:', err);
    } finally {
      setLinkingLoading(false);
    }
  };

  const handleUnlinkPatient = async (caseId: string, patientId: string) => {
    setLinkingLoading(true);
    try {
      await supabase.from('sessions').delete()
        .eq('patient_id', patientId).eq('analysis_id', caseId);

      await updateCase(caseId, { patient_id: undefined, session_number: undefined });
      await rebuildPatientMemory(patientId);

      setLinkingCaseId(null);
      setConfirmUnlink(null);
    } catch (err) {
      console.error('Erro ao desvincular caso:', err);
    } finally {
      setLinkingLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="surface-card p-7 lg:p-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-4 max-w-2xl">
          <div className="section-badge">
            <FolderHeart className="w-3 h-3 text-blue-600" />
            <span>Arquivo Clínico</span>
          </div>
          <h1 className="page-headline">
            <span className="page-headline-accent">Histórico</span> de casos.
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            Encontre, revise e gerencie suas análises e anotações clínicas com sigilo absoluto.
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

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3.5">
        <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
          <Filter className="w-3.5 h-3.5 text-blue-600" />
          <span>Filtrar e Buscar</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar título, relato, anotações..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-700 placeholder-slate-400 outline-none transition-colors"
            />
          </div>

          <select
            value={approachFilter}
            onChange={(e) => setApproachFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none transition-colors"
          >
            <option value="All">Todas as abordagens</option>
            {uniqueApproaches.map((ap) => (
              <option key={ap} value={ap}>{ap}</option>
            ))}
          </select>

          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none transition-colors"
          >
            <option value="All">Todas as tags</option>
            {uniqueTags.map((tag) => (
              <option key={tag} value={tag}>Tag: {tag}</option>
            ))}
          </select>

          {(searchTerm || approachFilter !== 'All' || tagFilter !== 'All') && (
            <button
              onClick={handleClearFilters}
              className="text-xs font-semibold text-blue-700 hover:text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl px-4 py-2.5 transition-all"
            >
              Limpar filtros
            </button>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
          <span className="text-[10px] font-medium text-slate-400">Mostrar conversas de chat</span>
          <button
            onClick={() => setShowChats(v => !v)}
            className={`relative w-8 h-4 rounded-full transition-colors ${showChats ? 'bg-blue-600' : 'bg-slate-200'}`}
          >
            <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all ${showChats ? 'left-4' : 'left-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Results */}
      {filteredCases.length === 0 ? (
        <div className="p-16 rounded-3xl border border-dashed border-slate-200 bg-white text-center space-y-4 max-w-xl mx-auto">
          <FolderHeart className="w-12 h-12 text-slate-300 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-800">Nenhum caso encontrado</h3>
            <p className="text-xs text-slate-500 leading-normal">
              Tente alterar os termos da busca ou limpar os filtros.
            </p>
          </div>
          <button
            onClick={handleClearFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-xs font-semibold text-blue-700 transition-colors"
          >
            Ver todos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCases.map((c) => {
            const linkedPatient = c.patient_id ? patients.find(p => p.id === c.patient_id) : null;
            const isLinking = linkingCaseId === c.id;

            return (
              <div
                key={c.id}
                className="group p-5 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 border border-blue-100 text-blue-700 uppercase tracking-wide">
                      {c.approach_used}
                    </span>
                    <div className="flex items-center gap-2">
                      {linkedPatient ? (
                        <div className="relative" ref={isLinking ? dropdownRef : undefined}>
                          <button
                            onClick={() => {
                              setConfirmUnlink(null);
                              setRelinkingCaseId(null);
                              setLinkingCaseId(isLinking ? null : c.id);
                            }}
                            className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full hover:bg-emerald-100 transition-colors"
                          >
                            <User className="w-2.5 h-2.5" />
                            {linkedPatient.pseudonym}
                            <ChevronDown className={`w-2.5 h-2.5 transition-transform ${isLinking ? 'rotate-180' : ''}`} />
                          </button>

                          {isLinking && (
                            <div className="absolute top-full mt-1 right-0 z-30 w-56 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                              {confirmUnlink?.caseId === c.id ? (
                                <div className="p-3 space-y-2.5">
                                  <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-xs text-slate-700 leading-snug">
                                      Desvincular este caso de <strong>{linkedPatient.pseudonym}</strong>?
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => setConfirmUnlink(null)}
                                      className="flex-1 py-1.5 text-[10px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      onClick={() => handleUnlinkPatient(c.id, linkedPatient.id)}
                                      disabled={linkingLoading}
                                      className="flex-1 py-1.5 text-[10px] font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                      Desvincular
                                    </button>
                                  </div>
                                </div>
                              ) : relinkingCaseId === c.id ? (
                                <>
                                  <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                                      Vincular a outro
                                    </span>
                                    <button onClick={() => setRelinkingCaseId(null)}>
                                      <X className="w-3.5 h-3.5 text-slate-400" />
                                    </button>
                                  </div>
                                  <div className="max-h-48 overflow-y-auto">
                                    {patients.filter(p => p.id !== linkedPatient.id).map(p => (
                                      <button
                                        key={p.id}
                                        onClick={() => handleRelinkPatient(c.id, linkedPatient.id, p.id)}
                                        disabled={linkingLoading}
                                        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-blue-50 transition-colors disabled:opacity-50"
                                      >
                                        <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                                          {p.pseudonym.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <span className="block text-xs font-medium text-slate-800 truncate">{p.pseudonym}</span>
                                          {p.age_range && <span className="block text-[10px] text-slate-400">{p.age_range}</span>}
                                        </div>
                                      </button>
                                    ))}
                                    {patients.filter(p => p.id !== linkedPatient.id).length === 0 && (
                                      <p className="px-3 py-3 text-[10px] text-slate-400">Nenhum outro paciente.</p>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <Link
                                    href={`/pacientes/${linkedPatient.id}`}
                                    className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 transition-colors text-xs text-slate-700 font-medium"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                    Ver perfil
                                  </Link>
                                  {patients.length > 1 && (
                                    <button
                                      onClick={() => setRelinkingCaseId(c.id)}
                                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-blue-50 transition-colors text-xs text-slate-700 font-medium"
                                    >
                                      <Link2 className="w-3.5 h-3.5 text-blue-500" />
                                      Vincular a outro paciente
                                    </button>
                                  )}
                                  <div className="border-t border-slate-100" />
                                  <button
                                    onClick={() => setConfirmUnlink({ caseId: c.id, patientName: linkedPatient.pseudonym })}
                                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-rose-50 transition-colors text-xs text-rose-600 font-medium"
                                  >
                                    <Link2Off className="w-3.5 h-3.5" />
                                    Desvincular
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      ) : null}
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(c.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-slate-800 group-hover:text-blue-700 transition-colors line-clamp-1">
                      {c.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                      {c.input_text}
                    </p>
                  </div>

                  {c.tags && c.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {c.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[9px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1"
                        >
                          <Tag className="w-2.5 h-2.5" />
                          <span>{t}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3 gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        if (confirm('Deseja realmente arquivar/deletar este caso clínico?')) {
                          deleteCase(c.id);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                      title="Arquivar/Deletar Caso"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Vincular a paciente */}
                    {!linkedPatient && patients.length > 0 && (
                      <div className="relative" ref={isLinking ? dropdownRef : undefined}>
                        <button
                          onClick={() => setLinkingCaseId(isLinking ? null : c.id)}
                          className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-semibold text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-100 hover:border-blue-100 rounded-xl transition-all"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                          Vincular
                          <ChevronDown className={`w-3 h-3 transition-transform ${isLinking ? 'rotate-180' : ''}`} />
                        </button>

                        {isLinking && (
                          <div className="absolute bottom-full mb-1 left-0 z-30 w-52 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                            <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                                Vincular a paciente
                              </span>
                              <button onClick={() => setLinkingCaseId(null)}>
                                <X className="w-3.5 h-3.5 text-slate-400" />
                              </button>
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                              {patients.map(p => (
                                <button
                                  key={p.id}
                                  onClick={() => handleLinkPatient(c.id, p.id)}
                                  disabled={linkingLoading}
                                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-blue-50 transition-colors disabled:opacity-50"
                                >
                                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                                    {p.pseudonym.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <span className="block text-xs font-medium text-slate-800 truncate">{p.pseudonym}</span>
                                    {p.age_range && <span className="block text-[10px] text-slate-400">{p.age_range}</span>}
                                  </div>
                                  <Check className="w-3.5 h-3.5 text-blue-600 opacity-0 group-hover:opacity-100" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/historico/${c.id}`}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 text-slate-600 hover:text-blue-700 rounded-xl text-xs font-semibold transition-all"
                  >
                    <span>Revisar caso</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
