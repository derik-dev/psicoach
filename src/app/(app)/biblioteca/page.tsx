'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Search,
  ArrowRight,
  Bookmark,
  Sparkles,
  Award,
  ChevronRight
} from 'lucide-react';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  approaches: string[];
  themes: string[];
  readingTime: string;
  references: string[];
}

const ARTICLES: Article[] = [
  {
    id: 'art-1',
    title: 'Como Manejar a Resistência Clínica na TCC',
    excerpt: 'Estratégias avançadas para desarmar esquemas de evitação e racionalização no setting cognitivo-comportamental.',
    content: 'A resistência em Terapia Cognitivo-Comportamental (TCC) não é vista como uma barreira intransponível, mas como o funcionamento ativo dos esquemas adaptativos disfuncionais do paciente. Quando um paciente recusa-se a realizar a "tarefa de casa" (plano de ação), ele geralmente está tentando evitar a ativação de uma crença de inadequação ("Se eu falhar na tarefa, provarei que sou incapaz"). Para manejar esse padrão:\n\n1. **Validação Afetiva:** Em vez de confrontar logicamente, valide o medo ("Percebo que tentar essa exposição ativa uma ansiedade enorme. É compreensível que queira se proteger").\n2. **Coformulação:** Formule a resistência junto com o paciente. Mostre como a esquiva é um comportamento de segurança que alivia o sofrimento no curto prazo, mas mantém o problema no longo prazo.\n3. **Fatiamento de Metas (Micrometas):** Reduza o nível de dificuldade da tarefa. Se a tarefa era "falar com 3 pessoas em público", reduza para "fazer contato visual por 5 segundos com o atendente da padaria".',
    approaches: ['TCC (Terapia Cognitivo-Comportamental)', 'Integrativa'],
    themes: ['técnicas', 'desenvolvimento'],
    readingTime: '5 min de leitura',
    references: ['Beck, J. S. (2021). Terapia Cognitivo-Comportamental: Teoria e Prática.', 'Leahy, R. L. (2501). Como lidar com clientes difíceis.']
  },
  {
    id: 'art-2',
    title: 'Sinais de Transferência e Contra-transferência na Clínica Psicanalítica',
    excerpt: 'Como identificar e ler as projeções inconscientes do analisando para guiar a direção do tratamento.',
    content: 'A transferência é o motor da psicanálise. Ela ocorre quando o analisando reedita na figura do analista seus protótipos infantis de relações objetais (pai, mãe, irmãos). Identificar estes sinais é crucial:\n\n1. **Idealização vs Hostilidade:** A idealização excessiva do analista ("O senhor é a única pessoa que me entende") frequentemente encobre sentimentos agressivos ou de abandono reprimidos que virão à tona mais tarde.\n2. **Demanda de Amor/Aprovação:** O paciente que muda suas roupas, traz relatos ultra-polidos ou omite verdades com medo de desagradar está sob uma transferência neurótica focada no desejo do Grande Outro.\n3. **Manejo da Contra-transferência:** O analista deve atentar-se aos seus próprios sentimentos na sessão (irritação, sono, pressa, vaidade). Esses afetos dizem muito sobre o que o paciente projeta (ex: induzir culpa no terapeuta para repetir o cenário de um Superego severo). Use essa percepção para formular interpretações, nunca para agir.',
    approaches: ['Psicanálise'],
    themes: ['técnicas', 'ética'],
    readingTime: '7 min de leitura',
    references: ['Freud, S. (1912). A Dinâmica da Transferência.', 'Lacan, J. (1960-1961). O Seminário: Livro 8: A Transferência.']
  },
  {
    id: 'art-3',
    title: 'Quando Encaminhar para Psiquiatria: Parâmetros Éticos e Clínicos',
    excerpt: 'Identificando o limiar em que a psicoterapia autônoma exige suporte farmacológico coadjuvante.',
    content: 'O encaminhamento ao psiquiatra deve ser guiado por critérios de gravidade e limitação funcional do ego, e nunca por insegurança do terapeuta. Parâmetros clínicos fundamentais:\n\n1. **Prejuízo Funcional Severo:** Quando o sofrimento impede o paciente de executar atividades básicas de sobrevivência (sono severamente desregulado há semanas, incapacidade de trabalhar ou tomar banho).\n2. **Ideação Suicida Ativa:** Casos de ideação estruturada com planejamento necessitam imediatamente de suporte psiquiátrico de urgência e rede de apoio familiar coadjuvante.\n3. **Ausência de Evolução Clínicas:** Casos de depressão unipolar severa ou TOC que, após 12-16 sessões focadas, não mostram redução nos marcadores afetivos ou comportamentais.\n4. **Psicoeducação no Encaminhamento:** Apresente o encaminhamento como uma aliança e não como incompetência da terapia: "A medicação atuará reorganizando os neurotransmissores para abrir uma janela de energia, permitindo que nosso trabalho terapêutico aconteça de forma mais profunda".',
    approaches: ['TCC (Terapia Cognitivo-Comportamental)', 'Psicanálise', 'Humanista', 'Sistêmica', 'Gestalt'],
    themes: ['transtornos', 'ética'],
    readingTime: '6 min de leitura',
    references: ['OMS (2022). Diretrizes de Saúde Mental da Organização Mundial da Saúde.', 'Conselho Federal de Psicologia (CFP). Código de Ética Profissional do Psicólogo.']
  },
  {
    id: 'art-4',
    title: 'Circularidade e Padrões Familiares na Abordagem Sistêmica',
    excerpt: 'Como mapear o genograma e identificar os ciclos repetitivos que sustentam o sintoma do paciente.',
    content: 'Na clínica sistêmica, o indivíduo que apresenta o sintoma (chamado de "paciente identificado") expressa, na verdade, uma disfunção de toda a ecologia familiar. Os problemas não são causados por relações lineares de causa e efeito (A causa B), mas sim por causalidades circulares (A afeta B, que realimenta A).\n\n1. **O Ciclo Perseguidor-Distanciador:** O clássico jogo em que um cônjuge exige atenção cobrando agressivamente → o outro se afasta para evitar o conflito → o primeiro sente-se abandonado e ataca com mais força → o segundo se isola. O sintoma é o ciclo em si.\n2. **Triangulação:** Processo em que dois membros em conflito (ex: pais) desviam a tensão para um terceiro (ex: filho), fazendo-o somatizar ou agir com agressividade como forma de manter os pais unidos para "cuidar do problema". Mapear esses triângulos é o primeiro passo para reestabelecer fronteiras geracionais saudáveis.',
    approaches: ['Sistêmica'],
    themes: ['técnicas', 'desenvolvimento'],
    readingTime: '8 min de leitura',
    references: ['Minuchin, S. (1974). Famílias e Casais: Técnicas de Terapia Familiar.', 'McGoldrick, M. (2015). Genogramas: Avaliação e Intervenção.']
  }
];

export default function ClinicalLibrary() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [approachFilter, setApproachFilter] = useState('All');
  const [themeFilter, setThemeFilter] = useState('All');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const filteredArticles = useMemo(() => {
    return ARTICLES.filter((art) => {
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
  }, [searchTerm, approachFilter, themeFilter]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setApproachFilter('All');
    setThemeFilter('All');
  };

  const handleAskAboutTheme = (article: Article) => {
    if (typeof window !== 'undefined') {
      const mockQuery = `Dra, gostaria de aprofundar um caso à luz do artigo "${article.title}". Descreva seu caso aqui relacionando-o com o tema do texto (ex: ${article.excerpt}).`;
      localStorage.setItem('psicoach_temp_query', mockQuery);
      router.push('/nova-analise');
    }
  };

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
                        <span>{art.readingTime}</span>
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
                  <span>{selectedArticle.readingTime}</span>
                  <span>•</span>
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

              {selectedArticle.references && (
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

              <button
                onClick={() => handleAskAboutTheme(selectedArticle)}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition-all shadow-[0_12px_28px_rgba(37,99,235,0.28)] hover:-translate-y-0.5"
              >
                <BookOpen className="w-4 h-4" />
                <span>Analisar caso sobre este tema</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
