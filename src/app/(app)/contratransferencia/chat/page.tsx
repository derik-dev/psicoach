'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase/client';
import {
  ArrowLeft,
  Activity,
  Send,
  Loader2,
  FolderHeart,
  X,
  Sparkles,
  Eye,
  Target,
  MessageSquare,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Search,
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface CtResult {
  padrao_identificado: string;
  impacto_no_caso: string;
  o_que_observar: string[];
  pergunta_reflexiva: string;
  nivel_processo: 'leve' | 'atencao' | 'significativo';
  referencia: string;
}

interface ImportedCase {
  id: string;
  title: string;
  approach_used: string;
  input_text: string;
  analysis: Record<string, unknown>;
}

const nivelConfig = {
  leve: { label: 'Processo Leve', bar: 'bg-emerald-400', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  atencao: { label: 'Requer Atenção', bar: 'bg-amber-400', badge: 'bg-amber-100 text-amber-700 border-amber-200', text: 'text-amber-700', dot: 'bg-amber-400' },
  significativo: { label: 'Processo Significativo', bar: 'bg-rose-400', badge: 'bg-rose-100 text-rose-700 border-rose-200', text: 'text-rose-700', dot: 'bg-rose-400' },
};

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: 'Olá! Estou aqui para te ajudar a refletir sobre o que aconteceu na sessão. Me conta — como foi?',
};

function buildCaseSummary(c: ImportedCase) {
  const a = c.analysis as { hypothesis?: string; approaches?: string[]; blind_spot?: string; alerts?: string[] };
  const parts = [
    `Relato: ${c.input_text}`,
    `Hipótese clínica: ${a.hypothesis || ''}`,
    `Intervenções: ${(a.approaches || []).join('; ')}`,
    `Ponto cego: ${a.blind_spot || ''}`,
  ];
  if (a.alerts?.length) parts.push(`Alertas: ${a.alerts.join('; ')}`);
  return parts.join('\n');
}

function AnalysisCard({ result }: { result: CtResult }) {
  const nivel = nivelConfig[result.nivel_processo] ?? nivelConfig.leve;
  return (
    <div className="mt-3 bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
      <div className={`h-1 w-full ${nivel.bar}`} />
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className={`w-4 h-4 ${nivel.text}`} />
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${nivel.badge}`}>
            {nivel.label}
          </span>
        </div>

        <div className="space-y-1.5">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Eye className="w-3 h-3 text-blue-500" /> Padrão identificado
          </p>
          <p className="text-xs leading-relaxed text-slate-700 p-3 bg-slate-50 rounded-xl border border-slate-100">
            {result.padrao_identificado}
          </p>
        </div>

        <div className="space-y-1.5">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Target className="w-3 h-3 text-blue-500" /> Impacto no caso
          </p>
          <p className="text-xs leading-relaxed text-slate-700 p-3 bg-slate-50 rounded-xl border border-slate-100">
            {result.impacto_no_caso}
          </p>
        </div>

        <div className="space-y-1.5">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <AlertTriangle className={`w-3 h-3 ${nivel.text}`} /> O que observar
          </p>
          <div className="space-y-1.5">
            {result.o_que_observar.map((item, i) => (
              <div key={i} className="flex gap-2 p-2.5 bg-amber-50 border border-amber-100 rounded-xl text-xs text-slate-700">
                <span className="w-4 h-4 rounded-full bg-amber-400 text-white flex items-center justify-center font-bold shrink-0 text-[9px]">{i + 1}</span>
                <span className="leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <MessageSquare className="w-3 h-3 text-blue-500" /> Pergunta reflexiva
          </p>
          <p
            className="text-xs leading-relaxed text-slate-600 p-3 bg-blue-50/60 border border-blue-100 border-l-4 border-l-blue-500 rounded-xl italic"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            &ldquo;{result.pergunta_reflexiva}&rdquo;
          </p>
        </div>

        <div className="flex gap-2 items-start pt-2 border-t border-slate-100">
          <BookOpen className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
          <p className="text-[10px] text-slate-500 leading-relaxed">{result.referencia}</p>
        </div>
      </div>
    </div>
  );
}

export default function ContratransferenciaChat() {
  const { cases } = useApp();
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<CtResult | null>(null);
  const [importedCase, setImportedCase] = useState<ImportedCase | null>(null);
  const [showCasePicker, setShowCasePicker] = useState(false);
  const [caseSearch, setCaseSearch] = useState('');
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, analysisResult, generatingAnalysis]);

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || sending) return;
    setError('');

    const userMsg: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setSending(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada.');

      const res = await fetch('/api/contratransferencia/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          messages: newMessages,
          case_summary: importedCase ? buildCaseSummary(importedCase) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar.');

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado.');
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const generateAnalysis = async () => {
    if (generatingAnalysis || messages.length < 3) return;
    setError('');
    setGeneratingAnalysis(true);

    const conversa = messages
      .map(m => `${m.role === 'user' ? 'Terapeuta' : 'Supervisora'}: ${m.content}`)
      .join('\n\n');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada.');

      const res = await fetch('/api/contratransferencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          case_id: importedCase?.id ?? 'chat-session',
          case_summary: importedCase ? buildCaseSummary(importedCase) : undefined,
          conversa,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar análise.');
      setAnalysisResult(data.resultado);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado.');
    } finally {
      setGeneratingAnalysis(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredCases = cases.filter(c =>
    c.title.toLowerCase().includes(caseSearch.toLowerCase())
  );

  const userTurns = messages.filter(m => m.role === 'user').length;

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-2xl mx-auto">

      {/* ── Header ── */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm mb-3 px-4 py-3 flex items-center gap-3 shrink-0">
        <Link
          href="/contratransferencia"
          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
          <Activity className="w-4 h-4 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-800 leading-none">Supervisão de Contratransferência</p>
          {importedCase ? (
            <p className="text-[10px] text-blue-600 mt-0.5 font-medium truncate">{importedCase.title}</p>
          ) : (
            <p className="text-[10px] text-slate-400 mt-0.5">Conversa livre</p>
          )}
        </div>

        {/* Case import button */}
        <div className="relative shrink-0">
          {importedCase ? (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-[10px] font-semibold text-blue-700 max-w-[120px]">
                <FolderHeart className="w-3 h-3 shrink-0" />
                <span className="truncate">{importedCase.title}</span>
              </div>
              <button
                onClick={() => setImportedCase(null)}
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowCasePicker(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-500 hover:text-blue-700 rounded-xl text-[11px] font-semibold transition-all"
            >
              <FolderHeart className="w-3.5 h-3.5" />
              Importar caso
              <ChevronDown className={`w-3 h-3 transition-transform ${showCasePicker ? 'rotate-180' : ''}`} />
            </button>
          )}

          {/* Case picker dropdown */}
          {showCasePicker && !importedCase && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-lg z-50 overflow-hidden">
              <div className="p-3 border-b border-slate-100">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={caseSearch}
                    onChange={e => setCaseSearch(e.target.value)}
                    placeholder="Buscar caso..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 outline-none"
                    autoFocus
                  />
                </div>
              </div>
              <div className="overflow-y-auto max-h-56">
                {filteredCases.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">Nenhum caso encontrado.</p>
                )}
                {filteredCases.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setImportedCase(c as unknown as ImportedCase);
                      setShowCasePicker(false);
                      setCaseSearch('');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-blue-50 text-left transition-colors border-b border-slate-50 last:border-0"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                      {c.approach_used?.slice(0, 3).toUpperCase() ?? '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{c.title}</p>
                      <p className="text-[10px] text-slate-400 truncate">{c.approach_used}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto space-y-3 px-1 pb-3">

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                <Activity className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white border border-slate-100 shadow-sm text-slate-700 rounded-bl-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {sending && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 mr-2 mt-0.5">
              <Activity className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-white border border-slate-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {/* Analysis generating */}
        {generatingAnalysis && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-xl bg-violet-600 flex items-center justify-center shrink-0 mr-2 mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-white border border-violet-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm">
              <div className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 text-violet-500 animate-spin" />
                <span className="text-xs text-slate-500">Gerando análise estruturada…</span>
              </div>
            </div>
          </div>
        )}

        {/* Analysis result card */}
        {analysisResult && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-xl bg-violet-600 flex items-center justify-center shrink-0 mr-2 mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="max-w-[90%]">
              <p className="text-xs text-slate-500 mb-1 pl-1">Análise estruturada</p>
              <AnalysisCard result={analysisResult} />
              {importedCase && (
                <Link
                  href={`/historico/${importedCase.id}`}
                  className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-blue-600 hover:underline"
                >
                  <FolderHeart className="w-3 h-3" /> Ver caso completo
                </Link>
              )}
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 text-center">
            {error}
          </p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input area ── */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-3 shrink-0 space-y-2">
        {/* Generate analysis button — appears after 2+ user turns */}
        {userTurns >= 2 && !analysisResult && (
          <div className="flex justify-center">
            <button
              onClick={generateAnalysis}
              disabled={generatingAnalysis}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all shadow-[0_4px_12px_rgba(124,58,237,0.25)] hover:-translate-y-0.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Gerar análise estruturada
            </button>
          </div>
        )}

        <form onSubmit={sendMessage} className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem… (Enter para enviar, Shift+Enter para nova linha)"
            rows={1}
            className="flex-1 bg-slate-50 border border-slate-200 focus:border-blue-400 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-700 placeholder-slate-400 outline-none transition-all resize-none leading-relaxed"
            style={{ maxHeight: '120px' }}
            onInput={e => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all shrink-0 shadow-[0_4px_12px_rgba(37,99,235,0.25)]"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
