'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Send, Plus, Bot, User, RotateCcw } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'Como abordar resistência terapêutica?',
  'Diferenças entre luto normal e patológico',
  'Como manejar a contratransferência?',
  'Quando indicar avaliação psiquiátrica?',
];

function generateResponse(text: string, approach: string): string {
  const t = text.toLowerCase();
  if (t.includes('resistên') || t.includes('resistencia')) {
    return `A resistência é clinicamente valiosa — indica que nos aproximamos de material defensivo central. Em ${approach}, recomendo nomear com empatia: "Percebo que uma parte sua hesita em avançar aqui. O que você acha que está protegendo?"\n\nEvite confrontação direta. Use curiosidade genuína como instrumento terapêutico.`;
  }
  if (t.includes('transferên') || t.includes('transferencia')) {
    return `A transferência revela os esquemas relacionais internalizados do paciente. Observe os padrões: você é tratado como figura de autoridade, cuidador ou perseguidor?\n\nNomear delicadamente: "Você parece antecipar minha desaprovação — isso ressoa com alguma experiência anterior?" pode abrir material inconsciente importante.`;
  }
  if (t.includes('luto')) {
    return `O luto não segue etapas rígidas. O marcador clínico do luto complicado não é a intensidade do sofrimento, mas a incapacidade de retomada do investimento em novas relações e projetos após meses.\n\nExplore a função psíquica que o objeto perdido ocupava: a saudade é da pessoa, ou do eu que existia ao lado dela?`;
  }
  if (t.includes('psiquiatr') || t.includes('medicaç')) {
    return `A indicação de avaliação psiquiátrica se fortalece em:\n\n• Sofrimento que interfere funcionalmente apesar de bom processo terapêutico\n• Sintomas neurovegetativos persistentes (sono, apetite, energia)\n• Ideação suicida com plano\n• Quadros com componente biológico evidente (ciclotimia, TDAH, psicose)\n\nA colaboração entre psicólogo e psiquiatra é uma aliança, não uma transferência de responsabilidade.`;
  }
  if (t.includes('contratransfer')) {
    return `A contratransferência bem manejada é seu instrumento clínico mais fino.\n\nSe você sente urge de proteger, salvar ou confrontar um paciente de forma intensa — isso é dado clínico. Pergunte-se: o que neste paciente ativa em mim?\n\nSupervisão e análise pessoal são os principais espaços para elaborar esse material.`;
  }
  if (t.includes('ansied') || t.includes('pânico')) {
    return `Em ${approach}, o trabalho com ansiedade envolve mapear os três níveis: pensamentos automáticos, pressupostos condicionais e crenças nucleares.\n\nPerguntas úteis: "O que o pior cenário significaria sobre você?" revela a crença nuclear. Experimentos comportamentais graduais são mais efetivos que a reestruturação cognitiva pura.`;
  }
  if (t.includes('depress')) {
    return `Na depressão, a tríade cognitiva (visão negativa de si, do mundo e do futuro) é o alvo principal em ${approach}.\n\nAtenção ao "comportamento de recuperação": ativação comportamental antes da mudança de humor é mais efetiva do que esperar o paciente "ter vontade" de agir. Pequenas vitórias reconstroem a autoeficácia.`;
  }
  return `Essa é uma questão clinicamente relevante. Dentro de ${approach}, sugiro mapear:\n\n1. Qual o padrão relacional e defensivo central do paciente?\n2. O que o sintoma tenta resolver ou comunicar?\n3. O que ainda não foi dito na sessão, mas está presente no corpo ou no silêncio?\n\nQuer explorar alguma dessas dimensões?`;
}

export default function ChatPage() {
  const { user } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const firstName = user?.name?.split(' ')[0] || 'Doutora';
  const isEmpty = messages.length === 0;

  useEffect(() => {
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const send = (text: string) => {
    if (!text.trim() || loading) return;
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', content: text }]);
    setInput('');
    setLoading(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: generateResponse(text, user?.mainApproach || 'TCC') },
      ]);
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }, 900 + Math.random() * 700);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <div className="-mx-5 -mb-5 -mt-20 lg:-mx-8 lg:-mb-8 lg:-mt-8 flex flex-col bg-[#0f0f0f] overflow-hidden" style={{ height: '100dvh' }}>

      {/* Header — only when there are messages */}
      {!isEmpty && (
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 shrink-0">
          <span className="text-[11px] font-semibold text-white/25 uppercase tracking-widest">Chat Clínico</span>
          <button
            onClick={() => { setMessages([]); setInput(''); }}
            className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/60 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Novo chat</span>
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full gap-7 px-5">
            <h1 className="text-2xl lg:text-[28px] font-light text-white/70 text-center">
              Como posso ajudar,{' '}
              <span className="font-semibold text-white">{firstName}</span>?
            </h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => send(s)}
                  className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/8 hover:border-white/15 rounded-2xl text-[13px] text-white/45 hover:text-white/80 text-left transition-all leading-snug"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Conversation */
          <div className="max-w-2xl mx-auto py-8 px-5 space-y-5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[78%] text-[13.5px] leading-relaxed whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-white/10 text-white/85 px-4 py-2.5 rounded-2xl rounded-tr-sm'
                      : 'text-white/70 pt-1'
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-white/40" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex items-center gap-1 py-2">
                  <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className={`px-5 lg:px-8 pt-3 ${isEmpty ? 'pb-14' : 'pb-5'} shrink-0`}>
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 bg-[#1c1c1c] border border-white/10 focus-within:border-white/20 rounded-full px-4 py-2.5 transition-all">
            <button
              type="button"
              className="text-white/25 hover:text-white/50 transition-colors shrink-0"
              tabIndex={-1}
            >
              <Plus className="w-5 h-5" />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte alguma coisa"
              autoFocus
              className="flex-1 bg-transparent text-[13.5px] text-white/80 placeholder:text-white/20 outline-none min-w-0"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-full bg-white flex items-center justify-center disabled:opacity-15 disabled:cursor-not-allowed hover:bg-white/90 transition-all shrink-0"
            >
              <Send className="w-3.5 h-3.5 text-black translate-x-px" />
            </button>
          </div>
        </form>
        {isEmpty && (
          <p className="text-[10px] text-white/15 text-center mt-3">
            Uso clínico exclusivo · Respeite o sigilo profissional (CFP)
          </p>
        )}
      </div>
    </div>
  );
}
