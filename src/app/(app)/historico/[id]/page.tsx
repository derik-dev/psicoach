'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase/client';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Save,
  CheckCircle,
  Copy,
  Plus,
  Send,
  User,
  Bot,
  Brain,
  TrendingUp,
  HelpCircle,
  BookOpen,
  Eye,
  AlertTriangle,
  FileEdit,
  Tag,
  Clock
} from 'lucide-react';

export default function IndividualCase() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { cases, updateCase, addChatMessage } = useApp();

  const c = cases.find((item) => item.id === id);

  const [notes, setNotes] = useState('');
  const [newTag, setNewTag] = useState('');
  const [saveNotesSuccess, setSaveNotesSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const [chatMessage, setChatMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (c) {
      setNotes(c.notes || '');
    }
  }, [c]);

  if (!c) {
    return (
      <div className="flex flex-col items-center justify-center h-[450px] gap-4 text-center px-6">
        <h2 className="text-xl font-light text-slate-800">Caso não encontrado.</h2>
        <p className="text-sm text-slate-500 max-w-md">
          Este caso clínico pode ter sido removido ou o link está incorreto.
        </p>
        <Link
          href="/historico"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao histórico</span>
        </Link>
      </div>
    );
  }

  // suppress unused router warning
  void router;

  const handleSaveNotes = () => {
    updateCase(c.id, { notes });
    setSaveNotesSuccess(true);
    setTimeout(() => setSaveNotesSuccess(false), 2000);
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim()) return;
    const tagClean = newTag.trim().toLowerCase();
    if (c.tags && c.tags.includes(tagClean)) {
      setNewTag('');
      return;
    }
    const updatedTags = c.tags ? [...c.tags, tagClean] : [tagClean];
    updateCase(c.id, { tags: updatedTags });
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = c.tags ? c.tags.filter((t) => t !== tagToRemove) : [];
    updateCase(c.id, { tags: updatedTags });
  };

  const handleCopyText = () => {
    const text = `
PSI-COACH AI - ANÁLISE DE CASO CLÍNICO
Caso: ${c.title}
Abordagem: ${c.approach_used}
Data: ${new Date(c.created_at).toLocaleDateString('pt-BR')}

HIPÓTESE CLÍNICA
${c.analysis.hypothesis}

ABORDAGENS SUGERIDAS
${c.analysis.approaches.map((a, i) => `${i + 1}. ${a}`).join('\n')}

PERGUNTAS PARA PRÓXIMA SESSÃO
${c.analysis.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

REFERÊNCIAS TEÓRICAS
${c.analysis.references.map((r, i) => `${i + 1}. ${r}`).join('\n')}

PONTO CEGO POSSÍVEL
${c.analysis.blind_spot}

ATENÇÃO E ALERTAS
${c.analysis.alerts.map((a) => `- ${a}`).join('\n')}
    `;
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const [chatError, setChatError] = useState<string | null>(null);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userText = chatMessage;
    setChatMessage('');
    setChatError(null);
    await addChatMessage(c.id, 'user', userText);
    setIsSendingMessage(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setChatError('Sessão expirada. Faça login novamente.');
        return;
      }

      const history = c.messages.map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          message: userText,
          approach: c.approach_used,
          context: c.context,
          history,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setChatError(data?.error || 'Não foi possível obter resposta da IA.');
      } else {
        const reply: string = data?.reply
          || (data?.analysis ? 'Análise gerada com sucesso.' : 'Resposta inesperada da IA.');
        await addChatMessage(c.id, 'assistant', reply);
      }
    } catch {
      setChatError('Falha de comunicação com o servidor de IA.');
    } finally {
      setIsSendingMessage(false);
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/historico"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar ao Histórico</span>
      </Link>

      {/* Case Header */}
      <div className="surface-card p-7 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 border border-blue-100 text-blue-700 uppercase tracking-wider">
              {c.approach_used}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>Criado em {new Date(c.created_at).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
          <h1 className="text-2xl lg:text-3xl font-light tracking-tight text-slate-900">
            {c.title}
          </h1>
          <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
            <strong className="text-slate-700">Relato inicial:</strong> &ldquo;{c.input_text.slice(0, 150)}...&rdquo;
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
          <Link
            href={`/nova-analise?case=${c.id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 rounded-full text-xs font-semibold transition-all"
          >
            <span>Editar caso</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={handleCopyText}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-600 hover:text-blue-700 hover:border-blue-200 rounded-xl text-xs font-semibold transition-all"
          >
            <Copy className="w-4 h-4" />
            <span>{copySuccess ? 'Copiado!' : 'Copiar análise'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Left columns */}
        <div className="xl:col-span-2 space-y-6">
          {/* Notes */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <FileEdit className="w-4 h-4 text-blue-600" />
                <span>Minhas notas & Evolução</span>
              </h2>
              <button
                onClick={handleSaveNotes}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar</span>
              </button>
            </div>

            {saveNotesSuccess && (
              <div className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                <span>Notas atualizadas com sucesso!</span>
              </div>
            )}

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotações da evolução terapêutica, reações às intervenções, insights..."
              rows={4}
              className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl p-3 text-xs text-slate-700 placeholder-slate-400 outline-none transition-colors resize-none leading-relaxed"
            />

            {/* Tags */}
            <div className="border-t border-slate-100 pt-3.5 space-y-3">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                <Tag className="w-3.5 h-3.5 text-blue-600" />
                <span>Tags do caso</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {c.tags && c.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 pl-2.5 pr-1.5 py-1 rounded-lg flex items-center gap-1.5"
                  >
                    <span>{t}</span>
                    <button
                      onClick={() => handleRemoveTag(t)}
                      className="text-slate-400 hover:text-rose-500 font-bold px-1 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}

                <form onSubmit={handleAddTag} className="flex gap-1.5">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Nova tag..."
                    className="bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-lg px-2.5 py-1 text-[10px] text-slate-700 outline-none transition-colors w-24"
                  />
                  <button
                    type="submit"
                    className="p-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-700 rounded-lg flex items-center justify-center"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Analysis */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Análise clínica PsiCoach AI</span>
            </h2>

            <div className="space-y-5">
              {/* Hypothesis */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-semibold text-slate-500 flex items-center gap-2 uppercase tracking-widest">
                  <span className="p-1 rounded bg-blue-50 text-blue-600"><Brain className="w-3.5 h-3.5" /></span>
                  <span>Hipótese clínica</span>
                </h4>
                <p className="text-xs leading-relaxed text-slate-700 p-4 bg-slate-50 border border-slate-100 rounded-2xl italic" style={{ fontFamily: 'Georgia, serif' }}>
                  {c.analysis.hypothesis}
                </p>
              </div>

              {/* Approaches */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-semibold text-slate-500 flex items-center gap-2 uppercase tracking-widest">
                  <span className="p-1 rounded bg-blue-50 text-blue-600"><TrendingUp className="w-3.5 h-3.5" /></span>
                  <span>Intervenções & Diretrizes</span>
                </h4>
                <div className="space-y-2">
                  {c.analysis.approaches.map((app, idx) => (
                    <div key={idx} className="flex gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-700">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold shrink-0 text-[10px]">
                        {idx + 1}
                      </span>
                      <p className="leading-relaxed">{app}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-semibold text-slate-500 flex items-center gap-2 uppercase tracking-widest">
                  <span className="p-1 rounded bg-blue-50 text-blue-600"><HelpCircle className="w-3.5 h-3.5" /></span>
                  <span>Perguntas para próxima sessão</span>
                </h4>
                <div className="space-y-2">
                  {c.analysis.questions.map((q, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-700 italic" style={{ fontFamily: 'Georgia, serif' }}>
                      &ldquo;{q}&rdquo;
                    </div>
                  ))}
                </div>
              </div>

              {/* References */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-semibold text-slate-500 flex items-center gap-2 uppercase tracking-widest">
                  <span className="p-1 rounded bg-blue-50 text-blue-600"><BookOpen className="w-3.5 h-3.5" /></span>
                  <span>Literatura & Embasamento</span>
                </h4>
                <div className="space-y-2">
                  {c.analysis.references.map((ref, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-600 leading-normal flex gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{ref}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Blind spot */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-semibold text-slate-500 flex items-center gap-2 uppercase tracking-widest">
                  <span className="p-1 rounded bg-blue-50 text-blue-600"><Eye className="w-3.5 h-3.5" /></span>
                  <span>Ponto cego do terapeuta</span>
                </h4>
                <p className="text-xs leading-relaxed text-slate-700 p-4 bg-blue-50/60 border border-blue-100 rounded-2xl border-l-4 border-l-blue-600">
                  {c.analysis.blind_spot}
                </p>
              </div>

              {/* Alerts */}
              {c.analysis.alerts && c.analysis.alerts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-semibold text-rose-500 flex items-center gap-2 uppercase tracking-widest">
                    <span className="p-1 rounded bg-rose-50 text-rose-500"><AlertTriangle className="w-3.5 h-3.5" /></span>
                    <span>Sinais de alerta & Segurança</span>
                  </h4>
                  <div className="p-4 bg-rose-50/60 border border-rose-100 rounded-2xl space-y-2">
                    {c.analysis.alerts.map((al, idx) => (
                      <div key={idx} className="text-xs text-rose-700 leading-relaxed flex gap-2">
                        <span className="text-rose-500 font-bold">•</span>
                        <span>{al}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column - Chat */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Aprofundar caso</span>
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Faça perguntas complementares sobre este caso específico.
            </p>
          </div>

          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {c.messages.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-8">
                Nenhuma pergunta feita. Digite sua dúvida no campo abaixo.
              </p>
            ) : (
              c.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-50 border border-blue-100 text-slate-700 ml-auto max-w-[90%]'
                      : 'bg-slate-50 border border-slate-100 text-slate-700 mr-auto max-w-[90%]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[9px] font-semibold text-slate-500 uppercase tracking-wide">
                    {msg.role === 'user' ? <User className="w-3 h-3 text-blue-600" /> : <Bot className="w-3 h-3 text-blue-600" />}
                    <span>{msg.role === 'user' ? 'Você' : 'PsiCoach AI'}</span>
                  </div>
                  <p className="whitespace-pre-line">{msg.content}</p>
                </div>
              ))
            )}

            {chatError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-[11px] text-rose-700 leading-relaxed">
                {chatError}
              </div>
            )}

            {isSendingMessage && (
              <div className="p-3.5 rounded-2xl text-xs bg-slate-50 border border-slate-100 text-slate-500 mr-auto max-w-[90%] flex gap-2">
                <Bot className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 animate-pulse" />
                <div className="flex items-center gap-1 py-1">
                  <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-slate-100 pt-3">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Pergunte sobre intervenções..."
              className="flex-1 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-full px-4 py-2 text-xs text-slate-700 outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!chatMessage.trim() || isSendingMessage}
              className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 text-white rounded-full transition-all shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
