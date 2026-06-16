'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useApp, ClinicalCase, CaseAnalysis } from '@/context/AppContext';
import { supabase } from '@/lib/supabase/client';
import {
  ArrowLeft, Send, Loader2, FolderHeart, X,
  MessageSquare, ChevronDown, Search,
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ImportedCase {
  id: string;
  title: string;
  approach_used: string;
  input_text: string;
  analysis: Record<string, unknown>;
}

function buildCaseSummary(c: ImportedCase) {
  const a = c.analysis as { hypothesis?: string; approaches?: string[]; blind_spot?: string; alerts?: string[] };
  const parts = [
    `Relato: ${c.input_text}`,
    a.hypothesis ? `Hipótese clínica: ${a.hypothesis}` : '',
    a.approaches?.length ? `Intervenções sugeridas: ${a.approaches.join('; ')}` : '',
    a.blind_spot ? `Ponto cego identificado: ${a.blind_spot}` : '',
  ].filter(Boolean);
  if (a.alerts?.length) parts.push(`Alertas: ${a.alerts.join('; ')}`);
  return parts.join('\n');
}

const EMPTY_ANALYSIS: CaseAnalysis = {
  hypothesis: '', approaches: [], questions: [], references: [], blind_spot: '', alerts: [],
};

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: 'Olá! Pode me descrever um caso ou importar uma análise já existente. O que você quer discutir hoje?',
};

export default function ChatPage() {
  const { cases, setCases } = useApp();
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [importedCase, setImportedCase] = useState<ImportedCase | null>(null);
  const [showCasePicker, setShowCasePicker] = useState(false);
  const [caseSearch, setCaseSearch] = useState('');
  const [error, setError] = useState('');
  const [chatCaseId, setChatCaseId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const createChatCase = async (firstMessage: string): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Sessão expirada.');

    const id = crypto.randomUUID();
    const title = `Chat — ${new Date().toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })}`;
    const now = new Date().toISOString();

    const { error: insertError } = await supabase.from('cases').insert({
      id,
      user_id: session.user.id,
      title,
      input_text: firstMessage.slice(0, 500),
      approach_used: 'Chat',
      context: {},
      analysis: EMPTY_ANALYSIS,
      notes: '',
      tags: ['chat'],
    });

    if (insertError) throw new Error(insertError.message);

    const newCase: ClinicalCase = {
      id, title,
      input_text: firstMessage.slice(0, 500),
      approach_used: 'Chat',
      context: {},
      analysis: EMPTY_ANALYSIS,
      notes: '', tags: ['chat'],
      created_at: now, updated_at: now,
      messages: [],
    };
    setCases(prev => [newCase, ...prev]);
    return id;
  };

  const persistMessage = async (caseId: string, role: 'user' | 'assistant', content: string) => {
    await supabase.from('messages').insert({ case_id: caseId, role, content });
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || sending) return;
    setError('');

    const text = input.trim();
    const userMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setSending(true);

    try {
      let id = chatCaseId;
      if (!id) {
        id = await createChatCase(text);
        setChatCaseId(id);
      }

      await persistMessage(id, 'user', text);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada.');

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          messages: newMessages,
          case_summary: importedCase ? buildCaseSummary(importedCase) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar.');

      const assistantMsg: Message = { role: 'assistant', content: data.reply };
      setMessages(prev => [...prev, assistantMsg]);
      await persistMessage(id, 'assistant', data.reply);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado.');
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredCases = cases
    .filter(c => c.approach_used !== 'Chat')
    .filter(c => c.title.toLowerCase().includes(caseSearch.toLowerCase()));

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-2xl mx-auto">

      {/* ── Header ── */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm mb-3 px-4 py-3 flex items-center gap-3 shrink-0">
        <Link
          href="/nova-analise"
          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
          <MessageSquare className="w-4 h-4 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-800 leading-none">Chat Clínico</p>
          {importedCase ? (
            <p className="text-[10px] text-blue-600 mt-0.5 font-medium truncate">{importedCase.title}</p>
          ) : (
            <p className="text-[10px] text-slate-400 mt-0.5">Supervisão livre com IA</p>
          )}
        </div>

        {/* Case import */}
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
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                <MessageSquare className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'bg-white border border-slate-100 shadow-sm text-slate-700 rounded-bl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 mr-2 mt-0.5">
              <MessageSquare className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-white border border-slate-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '300ms' }} />
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

      {/* ── Input ── */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-3 shrink-0">
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
