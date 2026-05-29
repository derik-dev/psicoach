'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import {
  ArrowLeft,
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

  // Find case
  const c = cases.find((item) => item.id === id);

  // Form states
  const [notes, setNotes] = useState('');
  const [newTag, setNewTag] = useState('');
  const [saveNotesSuccess, setSaveNotesSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Chat states
  const [chatMessage, setChatMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load notes once case is loaded
  useEffect(() => {
    if (c) {
      setNotes(c.notes || '');
    }
  }, [c]);

  // Redirect if case not found
  useEffect(() => {
    if (c === undefined && cases.length > 0) {
      router.push('/historico');
    }
  }, [c, cases, router]);

  if (!c) {
    return (
      <div className="flex h-[450px] items-center justify-center text-slate-400">
        Carregando dados do caso clínico...
      </div>
    );
  }

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

🔍 HIPÓTESE CLÍNICA
${c.analysis.hypothesis}

🛤️ ABORDAGENS SUGERIDAS
${c.analysis.approaches.map((a, i) => `${i + 1}. ${a}`).join('\n')}

❓ PERGUNTAS PARA PRÓXIMA SESSÃO
${c.analysis.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

📚 REFERÊNCIAS TEÓRICAS
${c.analysis.references.map((r, i) => `${i + 1}. ${r}`).join('\n')}

👁️ PONTO CEGO POSSÍVEL
${c.analysis.blind_spot}

⚠️ ATENÇÃO E ALERTAS
${c.analysis.alerts.map((a, i) => `- ${a}`).join('\n')}
    `;
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userText = chatMessage;
    setChatMessage('');
    addChatMessage(c.id, 'user', userText);
    setIsSendingMessage(true);

    setTimeout(() => {
      let botResponse = '';
      if (userText.toLowerCase().includes('transferencia') || userText.toLowerCase().includes('transferência')) {
        botResponse = 'Na clínica sob transferência, recomendo observar como o paciente projeta em você as demandas de aprovação infantil. Evite ocupar o lugar do juiz (Superego). Em vez disso, aponte em ato: "Você percebe que se preocupa em falar o que acha que eu gostaria de ouvir?". Isso desloca o sujeito para a própria implicação subjetiva.';
      } else if (userText.toLowerCase().includes('resistencia') || userText.toLowerCase().includes('resistência')) {
        botResponse = 'A resistência sinaliza que nos aproximamos de um núcleo doloroso (o trauma ou a fantasia nuclear). Na TCC, valide a dor ("Compreendo que seja muito difícil falar sobre isso") antes de insistir na exposição. Reduza o nível do experimento comportamental na escala de ansiedade, garantindo que o paciente sinta que tem controle sobre o processo.';
      } else if (userText.toLowerCase().includes('famili') || userText.toLowerCase().includes('pais') || userText.toLowerCase().includes('mãe')) {
        botResponse = 'Excelente ponto. As figuras parentais estabeleceram a "matriz de apego" do paciente. Investigue as regras implícitas estabelecidas pelo clã familiar: "Para ser amado neste clã, eu preciso sofrer/ser perfeito?". A neurose do paciente é a tentativa de responder a essa demanda infantil para assegurar o amor do outro.';
      } else {
        botResponse = `Essa é uma excelente reflexão clínica. Considerando a abordagem de ${c.approach_used}, recomendo que na próxima sessão você foque em desacelerar o ritmo e permitir que o paciente explore essa dúvida em primeira pessoa. O segredo é não fornecer respostas imediatas, mas atuar como o espelho que reflete as próprias incongruências estruturais do discurso dele. Como você se sente conduzindo essa intervenção?`;
      }

      addChatMessage(c.id, 'assistant', botResponse);
      setIsSendingMessage(false);

      // Scroll to bottom
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Return button */}
      <div>
        <Link
          href="/historico"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Histórico</span>
        </Link>
      </div>

      {/* Case Header Details */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900/60 to-slate-950 border border-slate-800 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 uppercase tracking-wider">
              {c.approach_used}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>Criado em {new Date(c.created_at).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-100">
            {c.title}
          </h1>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            <strong>Relato Inicial:</strong> "{c.input_text.slice(0, 150)}..."
          </p>
        </div>

        <button
          onClick={handleCopyText}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-950 border border-slate-800 text-slate-450 hover:text-indigo-400 hover:border-indigo-500/30 rounded-xl text-xs font-semibold transition-all self-start md:self-center"
        >
          <Copy className="w-4 h-4" />
          <span>{copySuccess ? 'Copiado!' : 'Copiar Análise'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Clinical Analysis & Notes */}
        <div className="xl:col-span-2 space-y-6">
          {/* Notes Card */}
          <div className="p-5 rounded-3xl bg-slate-900/30 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                <FileEdit className="w-4.5 h-4.5 text-indigo-400" />
                <span>Minhas Notas & Evolução do Paciente</span>
              </h2>
              <button
                onClick={handleSaveNotes}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar Notas</span>
              </button>
            </div>
            
            {saveNotesSuccess && (
              <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                <span>Notas atualizadas com sucesso!</span>
              </div>
            )}

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Digite aqui como o paciente reagiu às intervenções propostas nas últimas sessões, anotações de evolução terapêutica ou insights surgidos..."
              rows={4}
              className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 outline-none transition-colors resize-none leading-relaxed"
            />

            {/* Tag Editor */}
            <div className="border-t border-slate-800/80 pt-3.5 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                <Tag className="w-4 h-4 text-indigo-400" />
                <span>TAGS DO CASO</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {c.tags && c.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] font-bold text-slate-350 bg-slate-950 border border-slate-850 pl-2.5 pr-1.5 py-1 rounded-lg flex items-center gap-1.5"
                  >
                    <span>{t}</span>
                    <button
                      onClick={() => handleRemoveTag(t)}
                      className="text-slate-500 hover:text-rose-400 font-bold px-1 transition-colors"
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
                    placeholder="Adicionar tag..."
                    className="bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-lg px-2.5 py-1 text-[10px] text-slate-200 outline-none transition-colors w-24"
                  />
                  <button
                    type="submit"
                    className="p-1.5 bg-slate-800 hover:bg-indigo-600/35 border border-slate-850 hover:border-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Analysis Result Panels */}
          <div className="p-6 rounded-3xl bg-slate-900/30 border border-slate-800 space-y-6">
            <h2 className="text-base font-bold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-4.5 h-4.5 text-indigo-400" />
              <span>Análise Clínica PsiCoach AI</span>
            </h2>

            <div className="space-y-5">
              {/* Hypothesis */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 flex items-center gap-2">
                  <span className="p-1 rounded bg-indigo-500/10 text-indigo-400"><Brain className="w-3.5 h-3.5" /></span>
                  <span>HIPÓTESE CLÍNICA</span>
                </h4>
                <p className="text-xs leading-relaxed text-slate-350 p-4 bg-slate-950/40 border border-slate-900 rounded-2xl">
                  {c.analysis.hypothesis}
                </p>
              </div>

              {/* Approaches */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 flex items-center gap-2">
                  <span className="p-1 rounded bg-purple-500/10 text-purple-400"><TrendingUp className="w-3.5 h-3.5" /></span>
                  <span>INTERVENÇÕES & DIRETRIZES TERAPÊUTICAS</span>
                </h4>
                <div className="space-y-2">
                  {c.analysis.approaches.map((app, idx) => (
                    <div key={idx} className="flex gap-3 p-4 bg-slate-950/40 border border-slate-900 rounded-2xl text-xs text-slate-350">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-400 shrink-0">
                        {idx + 1}
                      </span>
                      <p className="leading-relaxed">{app}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Socratic Questions */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 flex items-center gap-2">
                  <span className="p-1 rounded bg-amber-500/10 text-amber-400"><HelpCircle className="w-3.5 h-3.5" /></span>
                  <span>PERGUNTAS RECOMENDADAS PARA PRÓXIMA SESSÃO</span>
                </h4>
                <div className="space-y-2">
                  {c.analysis.questions.map((q, idx) => (
                    <div key={idx} className="p-4 bg-slate-950/40 border border-slate-900 rounded-2xl text-xs text-slate-350 italic">
                      "{q}"
                    </div>
                  ))}
                </div>
              </div>

              {/* References */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 flex items-center gap-2">
                  <span className="p-1 rounded bg-emerald-500/10 text-emerald-400"><BookOpen className="w-3.5 h-3.5" /></span>
                  <span>LITERATURA & EMBASAMENTO CIENTÍFICO</span>
                </h4>
                <div className="space-y-2">
                  {c.analysis.references.map((ref, idx) => (
                    <div key={idx} className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl text-xs text-slate-400 leading-normal flex gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{ref}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Blind Spot */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 flex items-center gap-2">
                  <span className="p-1 rounded bg-sky-500/10 text-sky-400"><Eye className="w-3.5 h-3.5" /></span>
                  <span>PONTO CEGO DO TERAPEUTA</span>
                </h4>
                <p className="text-xs leading-relaxed text-slate-350 p-4 bg-slate-950/40 border border-slate-900 rounded-2xl border-l-2 border-l-indigo-500">
                  {c.analysis.blind_spot}
                </p>
              </div>

              {/* Alerts */}
              {c.analysis.alerts && c.analysis.alerts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-rose-450 flex items-center gap-2">
                    <span className="p-1 rounded bg-rose-500/10 text-rose-450"><AlertTriangle className="w-3.5 h-3.5" /></span>
                    <span>SINAIS DE ALERTA & SEGURANÇA</span>
                  </h4>
                  <div className="p-4 bg-rose-950/10 border border-rose-500/20 rounded-2xl space-y-2">
                    {c.analysis.alerts.map((al, idx) => (
                      <div key={idx} className="text-xs text-rose-300 leading-relaxed flex gap-2">
                        <span className="text-rose-400 font-bold">•</span>
                        <span>{al}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Dynamic Clinical Discussion */}
        <div className="p-5 rounded-3xl bg-slate-900/30 border border-slate-800 space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Aprofundar Caso Clínico</span>
            </h3>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Faça perguntas complementares ou debata situações de resistência e transferência sobre este caso específico.
            </p>
          </div>

          {/* Messages Area */}
          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {c.messages.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-8">
                Nenhuma pergunta complementar feita. Digite sua dúvida no campo abaixo para debater com o copiloto!
              </p>
            ) : (
              c.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600/10 border border-indigo-500/20 text-slate-200 ml-auto max-w-[90%]'
                      : 'bg-slate-950 border border-slate-850 text-slate-350 mr-auto max-w-[90%]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[9px] font-bold text-slate-550">
                    {msg.role === 'user' ? <User className="w-3.5 h-3.5 text-indigo-400" /> : <Bot className="w-3.5 h-3.5 text-purple-400" />}
                    <span>{msg.role === 'user' ? 'Você (Psicóloga)' : 'PsiCoach AI'}</span>
                  </div>
                  <p className="whitespace-pre-line">{msg.content}</p>
                </div>
              ))
            )}

            {isSendingMessage && (
              <div className="p-3.5 rounded-2xl text-xs bg-slate-950 border border-slate-850 text-slate-400 mr-auto max-w-[90%] flex gap-2">
                <Bot className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5 animate-pulse" />
                <div className="flex items-center gap-1 py-1">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Form */}
          <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-slate-800/60 pt-3">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Pergunte sobre intervenções, transferência..."
              className="flex-1 bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!chatMessage.trim() || isSendingMessage}
              className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-xl transition-all duration-200 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
