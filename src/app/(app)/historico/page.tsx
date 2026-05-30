'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import {
  FolderHeart,
  Search,
  Filter,
  Plus,
  ArrowRight,
  Trash2,
  Calendar,
  Tag
} from 'lucide-react';

export default function CaseHistory() {
  const { cases, deleteCase } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [approachFilter, setApproachFilter] = useState('All');
  const [tagFilter, setTagFilter] = useState('All');

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
  }, [cases, searchTerm, approachFilter, tagFilter]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setApproachFilter('All');
    setTagFilter('All');
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
          {filteredCases.map((c) => (
            <div
              key={c.id}
              className="group p-5 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 border border-blue-100 text-blue-700 uppercase tracking-wide">
                    {c.approach_used}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(c.created_at).toLocaleDateString('pt-BR')}</span>
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

              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
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

                <Link
                  href={`/historico/${c.id}`}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 text-slate-600 hover:text-blue-700 rounded-xl text-xs font-semibold transition-all"
                >
                  <span>Revisar caso</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
