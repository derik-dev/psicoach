'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useApp, Patient, PatientMemory, PatientSession, AttentionHistoryEntry } from '@/context/AppContext';
import { supabase } from '@/lib/supabase/client';
import {
  ArrowLeft, PlusCircle, Brain, CheckCircle2, Zap, TrendingUp,
  BookOpen, Edit2, Save, X, Clock, Activity, ChevronRight, Trash2,
} from 'lucide-react';

/* ── helpers ── */

function timeInTherapy(createdAt: string) {
  const weeks = Math.floor((Date.now() - new Date(createdAt).getTime()) / (7 * 24 * 60 * 60 * 1000));
  if (weeks === 0) return 'menos de 1 semana';
  if (weeks < 8) return `${weeks} semana${weeks > 1 ? 's' : ''}`;
  return `${Math.round(weeks / 4)} meses`;
}

function attentionColor(level: string) {
  if (level === 'alto') return { dot: 'bg-rose-500', badge: 'bg-rose-100 text-rose-700', label: 'Alta' };
  if (level === 'moderado') return { dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700', label: 'Moderada' };
  return { dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700', label: 'Baixa' };
}

/* ── Editable list ── */

function EditableList({
  title, icon: Icon, items, color, placeholder,
  onSave,
}: {
  title: string;
  icon: React.ElementType;
  items: string[];
  color: string;
  placeholder: string;
  onSave: (items: string[]) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(items);
  const [newItem, setNewItem] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  };

  const addItem = () => {
    if (!newItem.trim()) return;
    setDraft(prev => [...prev, newItem.trim()]);
    setNewItem('');
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className={`flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest ${color}`}>
          <Icon className="h-3.5 w-3.5" />
          {title}
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50">
            <Edit2 className="h-3.5 w-3.5" />
          </button>
        ) : (
          <div className="flex gap-1">
            <button onClick={handleSave} disabled={saving} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg">
              <Save className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => { setDraft(items); setEditing(false); }} className="p-1 text-slate-400 hover:bg-slate-50 rounded-lg">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          {draft.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <input
                value={item}
                onChange={e => setDraft(prev => prev.map((x, j) => j === i ? e.target.value : x))}
                className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-400"
              />
              <button onClick={() => setDraft(prev => prev.filter((_, j) => j !== i))}
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg mt-0.5">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem()}
              placeholder={placeholder}
              className="flex-1 rounded-lg border border-dashed border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-400"
            />
            <button onClick={addItem} className="px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs hover:bg-blue-500">
              +
            </button>
          </div>
        </div>
      ) : (
        <div>
          {items.length === 0 ? (
            <p className="text-xs text-slate-400 italic">{placeholder}</p>
          ) : (
            <ul className="space-y-1">
              {items.map((item, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-slate-700">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-current shrink-0 opacity-40" />
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Timeline ── */

function Timeline({ history }: { history: AttentionHistoryEntry[] }) {
  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center h-16 rounded-2xl border border-dashed border-slate-200 bg-white">
        <p className="text-xs text-slate-400">Nenhuma sessão registrada ainda.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm overflow-x-auto">
      <div className="flex items-center gap-0 min-w-max">
        {history.map((entry, i) => {
          const cfg = attentionColor(entry.level);
          return (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center gap-1.5 group relative">
                <div className={`w-4 h-4 rounded-full ${cfg.dot} shadow-sm cursor-pointer transition-transform group-hover:scale-125`} />
                <span className="text-[9px] text-slate-400 font-medium">S{entry.session_number}</span>
                {/* tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 min-w-[120px]">
                  <div className="rounded-lg bg-slate-800 text-white px-2.5 py-1.5 text-[10px] text-center shadow-lg">
                    <p className="font-semibold">Sessão {entry.session_number}</p>
                    <p className={`mt-0.5 font-medium ${cfg.badge.split(' ')[1]}`}>Atenção: {cfg.label}</p>
                    <p className="text-slate-400">{new Date(entry.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              </div>
              {i < history.length - 1 && (
                <div className="w-8 h-0.5 bg-slate-200 shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/* ── Session list item ── */

function SessionItem({ session, caseTitle }: { session: PatientSession; caseTitle: string | null }) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-slate-100 last:border-0">
      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 shrink-0">
        {session.session_number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-700">
            {new Date(session.created_at).toLocaleDateString('pt-BR')}
          </span>
          {caseTitle && <span className="text-xs text-slate-400 truncate">{caseTitle}</span>}
        </div>
        {session.therapist_notes ? (
          <p className="mt-1 text-xs text-slate-600 leading-relaxed line-clamp-2">{session.therapist_notes}</p>
        ) : (
          <p className="mt-1 text-xs text-slate-400 italic">Sem nota da terapeuta.</p>
        )}
      </div>
      {session.analysis_id && (
        <Link
          href={`/historico/${session.analysis_id}`}
          className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-500"
        >
          Ver análise <ChevronRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

/* ── Main Page ── */

export default function PatientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { patients, updatePatient } = useApp();

  const patient = patients.find(p => p.id === id);

  const [memory, setMemory] = useState<PatientMemory | null>(null);
  const [sessions, setSessions] = useState<PatientSession[]>([]);
  const [caseTitles, setCaseTitles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from('patient_memory').select('*').eq('patient_id', id).single(),
      supabase.from('sessions').select('*').eq('patient_id', id).order('session_number', { ascending: true }),
    ]).then(([memResult, sessResult]) => {
      if (memResult.data) setMemory(memResult.data as PatientMemory);
      if (sessResult.data) {
        const sess = sessResult.data as PatientSession[];
        setSessions(sess);
        const analysisIds = sess.filter(s => s.analysis_id).map(s => s.analysis_id!);
        if (analysisIds.length > 0) {
          supabase.from('cases').select('id, title').in('id', analysisIds).then(({ data }) => {
            if (data) {
              const map: Record<string, string> = {};
              for (const c of data) map[c.id] = c.title || 'Sem título';
              setCaseTitles(map);
            }
          });
        }
      }
    }).finally(() => setLoading(false));
  }, [id]);

  const updateMemoryField = async (field: keyof PatientMemory, value: string[]) => {
    if (!id) return;
    const now = new Date().toISOString();
    const updates = { [field]: value, updated_at: now };

    if (memory?.id) {
      await supabase.from('patient_memory').update(updates).eq('patient_id', id);
      setMemory(prev => prev ? { ...prev, [field]: value, updated_at: now } : null);
    } else {
      const { data } = await supabase.from('patient_memory')
        .insert({ patient_id: id, [field]: value })
        .select('*').single();
      if (data) setMemory(data as PatientMemory);
    }
  };

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-slate-500 text-sm">Paciente não encontrado.</p>
        <Link href="/pacientes" className="text-blue-600 text-sm hover:underline">
          ← Voltar para pacientes
        </Link>
      </div>
    );
  }

  const attentionHistory = (memory?.attention_history || []) as AttentionHistoryEntry[];
  const lastAttention = attentionHistory.length > 0 ? attentionHistory[attentionHistory.length - 1].level : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3">
          <ArrowLeft className="h-4 w-4" /> Pacientes
        </button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl font-bold shrink-0">
              {patient.pseudonym.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{patient.pseudonym}</h1>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                {patient.age_range && (
                  <span className="text-xs text-slate-500">{patient.age_range} anos</span>
                )}
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="h-3 w-3" /> {timeInTherapy(patient.created_at)} em terapia
                </span>
                {sessions.length > 0 && (
                  <span className="text-xs text-slate-400">{sessions.length} sessões</span>
                )}
                {lastAttention && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${attentionColor(lastAttention).badge}`}>
                    <Activity className="h-2.5 w-2.5" /> {attentionColor(lastAttention).label}
                  </span>
                )}
                {patient.approach && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                    {patient.approach}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Link
            href={`/nova-analise?patient=${patient.id}`}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)] hover:bg-blue-500 hover:-translate-y-0.5 transition-all shrink-0"
          >
            <PlusCircle className="h-4 w-4" /> Nova análise
          </Link>
        </div>
      </div>

      {/* Motivo de entrada */}
      {patient.entry_reason && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-blue-600">Motivo de entrada</span>
          <p className="mt-1 text-sm text-blue-900">{patient.entry_reason}</p>
        </div>
      )}

      {/* Linha do tempo */}
      <div>
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
          Linha do tempo
        </h2>
        {loading ? (
          <div className="h-16 rounded-2xl bg-slate-100 animate-pulse" />
        ) : (
          <Timeline history={attentionHistory} />
        )}
      </div>

      {/* Memória clínica */}
      <div>
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
          Memória clínica
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <EditableList
            title="Hipóteses confirmadas"
            icon={Brain}
            color="text-blue-600"
            items={memory?.confirmed_hypotheses || []}
            placeholder="Adicionar hipótese confirmada..."
            onSave={items => updateMemoryField('confirmed_hypotheses', items)}
          />
          <EditableList
            title="O que funcionou"
            icon={CheckCircle2}
            color="text-emerald-600"
            items={memory?.what_worked || []}
            placeholder="Adicionar intervenção que funcionou..."
            onSave={items => updateMemoryField('what_worked', items)}
          />
          <EditableList
            title="Padrões recorrentes"
            icon={TrendingUp}
            color="text-amber-600"
            items={memory?.recurring_patterns || []}
            placeholder="Adicionar padrão observado..."
            onSave={items => updateMemoryField('recurring_patterns', items)}
          />
          <EditableList
            title="Temas centrais"
            icon={BookOpen}
            color="text-violet-600"
            items={memory?.central_themes || []}
            placeholder="Adicionar tema central..."
            onSave={items => updateMemoryField('central_themes', items)}
          />
        </div>

        {/* Cards adicionais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <EditableList
            title="Hipóteses descartadas"
            icon={X}
            color="text-slate-500"
            items={memory?.discarded_hypotheses || []}
            placeholder="Adicionar hipótese descartada..."
            onSave={items => updateMemoryField('discarded_hypotheses', items)}
          />
          <EditableList
            title="O que não funcionou"
            icon={Zap}
            color="text-rose-500"
            items={memory?.what_didnt_work || []}
            placeholder="Adicionar o que não funcionou..."
            onSave={items => updateMemoryField('what_didnt_work', items)}
          />
        </div>
      </div>

      {/* Histórico de sessões */}
      <div>
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
          Histórico de sessões
        </h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-2xl bg-slate-100 animate-pulse" />)}
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-10">
            <p className="text-sm text-slate-400">Nenhuma sessão registrada ainda.</p>
            <Link href="/nova-analise" className="mt-2 text-sm text-blue-600 hover:underline">
              Criar primeira análise →
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-white px-5 shadow-sm">
            {[...sessions].reverse().map(session => (
              <SessionItem
                key={session.id}
                session={session}
                caseTitle={session.analysis_id ? (caseTitles[session.analysis_id] || null) : null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
