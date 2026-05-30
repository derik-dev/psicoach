'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Search,
  Bookmark,
  Sparkles,
  Award,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  approaches: string[];
  themes: string[];
  reading_time: string | null;
  references: string[];
}

export default function ClinicalLibrary() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [approachFilter, setApproachFilter] = useState('All');
  const [themeFilter, setThemeFilter] = useState('All');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('library_articles')
        .select('*')
        .order('created_at', { ascending: false });
      if (cancelled) return;
      if (error) {
        setLoadError(true);
        setArticles([]);
      } else {
        const normalized: Article[] = (data || []).map((row: Record<string, unknown>) => ({
          id: String(row.id),
          title: (row.title as string) || '',
          excerpt: (row.excerpt as string) || '',
          content: (row.content as string) || '',
          approaches: (row.approaches as string[]) || [],
          themes: (row.themes as string[]) || [],
          reading_time: (row.reading_time as string) || null,
          references: (row.references as string[]) || [],
        }));
        setArticles(normalized);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      const matchesSearch =
        art.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        art.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        art.content.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesApproach =
        approachFilter === 'All' ||
        art.approaches.some((ap) => ap.includes(approachFilter));

      const matchesTheme =
        themeFilter === 'All' || art.themes.includes(themeFilter);

      return matchesSearch && matchesApproach && matchesTheme;
    });
  }, [articles, searchTerm, approachFilter, themeFilter]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setApproachFilter('All');
    setThemeFilter('All');
  };

  const isEmpty = !loading && articles.length === 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="surface-card p-7 lg:p-10 space-y-4">
        <div className="section-badge">
          <BookOpen className="w-3 h-3 text-blue-600" />
          <span>Biblioteca Clínica</span>
        </div>
        <h1 className="page-headline">
          Conhecimento <span className="page-headline-accent">aplicado.</span>
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">
          Explore artigos técnicos, referências bibliográficas e diretrizes clínicas baseadas em evidências para o seu dia a dia.
        </p>
      </div>

      {loading ? (
        <div className="p-12 rounded-3xl bg-white border border-slate-100 shadow-sm text-center text-sm text-slate-500">
          Carregando biblioteca...
        </div>
      ) : isEmpty ? (
        <div className="p-16 rounded-3xl border border-dashed border-slate-200 bg-white text-center space-y-3 max-w-xl mx-auto">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800">Biblioteca em construção</h3>
          <p className="text-xs text-slate-500 leading-normal">
            {loadError
              ? 'Não foi possível carregar os artigos no momento.'
              : 'Ainda não há artigos publicados. Em breve você encontrará referências clínicas selecionadas aqui.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          {/* Left: Articles list */}
          <div className="xl:col-span-2 space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar conceitos..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 placeholder-slate-400 outline-none transition-colors"
                />
              </div>

              <select
                value={approachFilter}
                onChange={(e) => setApproachFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none transition-colors"
              >
                <option value="All">Todas as abordagens</option>
                <option value="TCC">TCC</option>
                <option value="Psicanálise">Psicanálise</option>
                <option value="Sistêmica">Sistêmica</option>
              </select>

              <select
                value={themeFilter}
                onChange={(e) => setThemeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none transition-colors"
              >
                <option value="All">Todos os temas</option>
                <option value="transtornos">Transtornos</option>
                <option value="técnicas">Técnicas</option>
                <option value="ética">Ética & Conduta</option>
                <option value="desenvolvimento">Desenvolvimento Profissional</option>
              </select>
            </div>

            <div className="space-y-4">
              {filteredArticles.length === 0 ? (
                <div className="p-12 rounded-3xl border border-dashed border-slate-200 bg-white text-center space-y-3">
                  <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm text-slate-500">Nenhum conceito encontrado.</p>
                  <button
                    onClick={handleClearFilters}
                    className="text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors"
                  >
                    Limpar filtros
                  </button>
                </div>
              ) : (
                filteredArticles.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => setSelectedArticle(art)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                      selectedArticle?.id === art.id
                        ? 'bg-blue-50/50 border-blue-300 shadow-sm'
                        : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                        <span className="flex items-center gap-1">
                          <Bookmark className="w-3.5 h-3.5 text-blue-600" />
                          <span>{art.reading_time || 'Leitura técnica'}</span>
                        </span>
                        <div className="flex gap-1">
                          {art.themes.map((t) => (
                            <span key={t} className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-500 uppercase tracking-wide">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <h3 className="text-base font-semibold text-slate-800 hover:text-blue-700 transition-colors">
                        {art.title}
                      </h3>

                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {art.excerpt}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                      <div className="flex gap-1.5 flex-wrap">
                        {art.approaches.map((ap) => (
                          <span key={ap} className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-100 text-blue-700 font-semibold">
                            {ap}
                          </span>
                        ))}
                      </div>

                      <span className="text-blue-700 font-semibold hover:text-blue-600 flex items-center gap-1 transition-colors">
                        <span>Ler</span>
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Selected article */}
          <div className="space-y-6">
            {!selectedArticle ? (
              <div className="p-8 rounded-3xl border border-dashed border-slate-200 bg-white text-center h-[450px] flex flex-col items-center justify-center space-y-3">
                <Award className="w-10 h-10 text-slate-300" />
                <h3 className="text-sm font-semibold text-slate-700">Selecione um artigo</h3>
                <p className="text-xs text-slate-500 leading-normal max-w-xs">
                  Clique em qualquer artigo da biblioteca para ler o conteúdo integral.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
                <div className="space-y-3">
                  <span className="text-[10px] font-semibold text-blue-700 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Conteúdo Homologado</span>
                  </span>
                  <h2 className="text-lg font-semibold text-slate-800 leading-snug">
                    {selectedArticle.title}
                  </h2>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    {selectedArticle.reading_time && <span>{selectedArticle.reading_time}</span>}
                    {selectedArticle.reading_time && selectedArticle.themes.length > 0 && <span>•</span>}
                    <span className="capitalize">{selectedArticle.themes.join(', ')}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-700 leading-relaxed space-y-4 border-t border-b border-slate-100 py-4 max-h-[300px] overflow-y-auto pr-1">
                  {selectedArticle.content.split('\n\n').map((paragraph, idx) => (
                    <p key={idx} className="whitespace-pre-line">
                      {paragraph}
                    </p>
                  ))}
                </div>

                {selectedArticle.references && selectedArticle.references.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Referências
                    </span>
                    <div className="space-y-1.5">
                      {selectedArticle.references.map((ref, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-50 rounded-xl text-[10px] text-slate-600 leading-relaxed border border-slate-100 flex gap-2">
                          <span className="text-blue-600 font-bold shrink-0 mt-0.5">•</span>
                          <span>{ref}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
