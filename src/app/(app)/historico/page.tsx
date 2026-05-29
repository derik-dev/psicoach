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
  Layers,
  Tag
} from 'lucide-react';

export default function CaseHistory() {
  const { cases, deleteCase } = useApp();
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [approachFilter, setApproachFilter] = useState('All');
  const [tagFilter, setTagFilter] = useState('All');

  // Gather all unique approaches and tags for filter dropdowns
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

  // Filter cases statefully
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
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <FolderHeart className="w-7 h-7 text-indigo-500" />
            <span>Histórico de Casos</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Encontre, revise e gerencie suas análises e anotações clínicas de pacientes.
          </p>
        </div>
        <Link
          href="/nova-analise"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl text-xs transition-all duration-200 shadow-md shadow-indigo-500/10 active:scale-98 self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Análise</span>
        </Link>
      </div>

      {/* Filter panel */}
      <div className="p-4 rounded-2xl bg-slate-900/30 border border-slate-800 backdrop-blur-md space-y-3.5">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-450">
          <Filter className="w-4 h-4 text-indigo-400" />
          <span>FILTRAR E BUSCAR</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {/* Text search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar título, relato, anotações..."
              className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-650 outline-none transition-colors"
            />
          </div>

          {/* Approach Filter */}
          <select
            value={approachFilter}
            onChange={(e) => setApproachFilter(e.target.value)}
            className="bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-xs text-slate-300 outline-none transition-colors"
          >
            <option value="All">Todas as abordagens</option>
            {uniqueApproaches.map((ap) => (
              <option key={ap} value={ap}>
                {ap}
              </option>
            ))}
          </select>

          {/* Tag Filter */}
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-xs text-slate-300 outline-none transition-colors"
          >
            <option value="All">Todas as tags</option>
            {uniqueTags.map((tag) => (
              <option key={tag} value={tag}>
                Tag: {tag}
              </option>
            ))}
          </select>

          {/* Clear Button */}
          {(searchTerm || approachFilter !== 'All' || tagFilter !== 'All') && (
            <button
              onClick={handleClearFilters}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl px-4 py-2.5 transition-all text-center"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Case cards grid */}
      {filteredCases.length === 0 ? (
        <div className="p-16 rounded-3xl border border-dashed border-slate-800 text-center space-y-4 bg-slate-900/10 max-w-xl mx-auto mt-8">
          <FolderHeart className="w-12 h-12 text-slate-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-200">Nenhum caso clínico encontrado</h3>
            <p className="text-xs text-slate-400 leading-normal">
              Tente alterar os termos da busca ou limpar os filtros para visualizar outros registros salvos.
            </p>
          </div>
          <button
            onClick={handleClearFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
          >
            Ver todos os casos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCases.map((c) => (
            <div
              key={c.id}
              className="group p-5 rounded-2xl bg-slate-900/30 hover:bg-slate-900/50 border border-slate-800 hover:border-indigo-500/40 transition-all duration-350 flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div className="space-y-3">
                {/* Header indicators */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 uppercase tracking-wide">
                    {c.approach_used}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(c.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                {/* Title & snippet */}
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-200 group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {c.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                    {c.input_text}
                  </p>
                </div>

                {/* Tags row */}
                {c.tags && c.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {c.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[9px] font-bold text-slate-550 bg-slate-950 border border-slate-850 px-2 py-0.5 rounded-md flex items-center gap-1"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        <span>{t}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between border-t border-slate-800/60 pt-3 mt-1">
                <button
                  onClick={() => {
                    if (confirm('Deseja realmente arquivar/deletar este caso clínico de forma segura?')) {
                      deleteCase(c.id);
                    }
                  }}
                  className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                  title="Arquivar/Deletar Caso"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <Link
                  href={`/historico/${c.id}`}
                  className="inline-flex items-center justify-center gap-1.5 px-4.5 py-2 bg-slate-950 hover:bg-indigo-600/15 border border-slate-850 hover:border-indigo-500/30 text-slate-350 hover:text-indigo-300 rounded-xl text-xs font-semibold transition-all duration-200"
                >
                  <span>Revisar Caso</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
