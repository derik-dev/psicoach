'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useApp, Patient, PatientMemory, PatientSession, AttentionHistoryEntry } from '@/context/AppContext';
import { supabase } from '@/lib/supabase/client';
import {
  ArrowLeft, PlusCircle, Brain, CheckCircle2, Zap, TrendingUp,
  BookOpen, Edit2, Save, X, Clock, Activity, ChevronRight, Trash2,
  User, Stethoscope, Pill, Share2, CalendarDays, AlertTriangle,
} from 'lucide-react';

/* ── helpers ── */

function timeInTherapy(createdAt: string) {
  const weeks = Math.floor((Date.now() - new Date(createdAt).getTime()) / (7 * 24 * 60 * 60 * 1000));
  if (weeks === 0) return 'menos de 1 semana';
  if (weeks < 8) return `${weeks} semana${weeks > 1 ? 's' : ''}`;
  return `${Math.round(weeks / 4)} meses`;
}

function attentionColor(level: string) {
  if (level === 'alto') return { dot: 'bg-rose-500', badge: 'bg-rose-100 text-rose-700', label: 'Alta atenção' };
  if (level === 'moderado') return { dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700', label: 'Atenção moderada' };
  return { dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700', label: 'Baixa atenção' };
}

const AVATAR_COLORS = [
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-rose-500',
  'from-cyan-500 to-blue-600',
];
function avatarGradient(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

/* ── Editable list ── */

function EditableList({
  title, icon: Icon, items, accentClass, placeholder, onSave,
}: {
  title: string;
  icon: React.ElementType;
  items: string[];
  accentClass: string;
  placeholder: string;
  onSave: (items: string[]) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(items);
  const [newItem, setNewItem] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!editing) setDraft(items); }, [items, editing]);

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
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest ${accentClass}`}>
          <Icon className="h-3.5 w-3.5" />
          {title}
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)}
            className="p-1 text-slate-300 hover:text-slate-500 rounded-lg hover:bg-slate-50 transition-colors">
            <Edit2 className="h-3.5 w-3.5" />
          </button>
        ) : (
          <div className="flex gap-1">
            <button onClick={handleSave} disabled={saving}
              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
              <Save className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => { setDraft(items); setEditing(false); }}
              className="p-1 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          {draft.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <input value={item}
                onChange={e => setDraft(prev => prev.map((x, j) => j === i ? e.target.value : x))}
                className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-400" />
              <button onClick={() => setDraft(prev => prev.filter((_, j) => j !== i))}
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg mt-0.5 transition-colors">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input value={newItem} onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem()}
              placeholder={placeholder}
              className="flex-1 rounded-lg border border-dashed border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-400" />
            <button onClick={addItem}
              className="px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs hover:bg-blue-500 transition-colors">+</button>
          </div>
        </div>
      ) : (
        items.length === 0 ? (
          <p className="text-[11px] text-slate-400 italic">{placeholder}</p>
        ) : (
          <ul className="space-y-1.5">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current shrink-0 opacity-30" />
                {item}
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}

/* ── Timeline ── */

function Timeline({ history }: { history: AttentionHistoryEntry[] }) {
  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center h-14 rounded-2xl border border-dashed border-slate-200 bg-white">
        <p className="text-xs text-slate-400">Nenhuma sessão com análise registrada ainda.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm overflow-x-auto">
      <div className="flex items-center gap-0 min-w-max">
        {history.map((entry, i) => {
          const cfg = attentionColor(entry.level);
          return (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center gap-1.5 group relative">
                <div className={`w-3.5 h-3.5 rounded-full ${cfg.dot} cursor-pointer transition-transform group-hover:scale-125`} />
                <span className="text-[9px] text-slate-400 font-medium">S{entry.session_number}</span>
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 min-w-[130px]">
                  <div className="rounded-xl bg-slate-800 text-white px-3 py-2 text-[10px] text-center shadow-xl">
                    <p className="font-semibold">Sessão {entry.session_number}</p>
                    <p className={`mt-0.5 font-medium ${cfg.badge.split(' ')[1]}`}>{cfg.label}</p>
                    <p className="text-slate-400 mt-0.5">{new Date(entry.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              </div>
              {i < history.length - 1 && <div className="w-8 h-px bg-slate-200 shrink-0" />}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/* ── Session item ── */

function SessionItem({ session, caseTitle }: { session: PatientSession; caseTitle: string | null }) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-slate-50 last:border-0">
      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
        {session.session_number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-700">
            {new Date(session.created_at).toLocaleDateString('pt-BR')}
          </span>
          {caseTitle && <span className="text-[11px] text-slate-400 truncate">{caseTitle}</span>}
        </div>
        {session.therapist_notes ? (
          <p className="mt-1 text-xs text-slate-500 leading-relaxed line-clamp-2">{session.therapist_notes}</p>
        ) : (
          <p className="mt-1 text-[11px] text-slate-300 italic">Sem anotação.</p>
        )}
      </div>
      {session.analysis_id && (
        <Link href={`/historico/${session.analysis_id}`}
          className="shrink-0 flex items-center gap-0.5 text-[11px] font-semibold text-blue-600 hover:text-blue-500 transition-colors">
          Análise <ChevronRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

/* ── Metadata chip ── */
function MetaChip({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 min-w-0">
      <Icon className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
        <p className="text-xs text-slate-700 mt-0.5 leading-snug">{value}</p>
      </div>
    </div>
  );
}

/* ── Main Page ── */

export default function PatientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { patients } = useApp();

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
        .insert({ patient_id: id, [field]: value }).select('*').single();
      if (data) setMemory(data as PatientMemory);
    }
  };

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-slate-500 text-sm">Paciente não encontrado.</p>
        <Link href="/pacientes" className="text-blue-600 text-sm hover:underline">← Voltar</Link>
      </div>
    );
  }

  const attentionHistory = (memory?.attention_history || []) as AttentionHistoryEntry[];
  const lastAttention = attentionHistory.length > 0 ? attentionHistory[attentionHistory.length - 1].level : null;
  const attnCfg = lastAttention ? attentionColor(lastAttention) : null;

  const metaFields: { icon: React.ElementType; label: string; value: string }[] = [
    { icon: User,        label: 'Gênero',      value: patient.gender },
    { icon: Stethoscope, label: 'Diagnóstico',  value: patient.initial_diagnosis },
    { icon: Pill,        label: 'Medicação',    value: patient.medication_use },
    { icon: Share2,      label: 'Chegou via',   value: patient.referral_source },
    { icon: Brain,       label: 'Abordagem',    value: patient.approach },
    { icon: CalendarDays,label: 'Sessões prev.',value: patient.sessions_count },
  ].filter(f => f.value);

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Back */}
      <button onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Pacientes
      </button>

      {/* Hero header */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        {/* Top accent */}
        {attnCfg && <div className={`h-1 w-full ${attnCfg.dot}`} />}

        <div className="p-5 flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Avatar */}
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${avatarGradient(patient.pseudonym)} flex items-center justify-center text-white text-2xl font-bold shrink-0 shadow-sm`}>
            {patient.pseudonym.slice(0, 2).toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-xl font-bold text-slate-800 leading-tight">{patient.pseudonym}</h1>
                <div className="flex items-center gap-3 flex-wrap mt-1.5">
                  {patient.age_range && (
                    <span className="text-xs text-slate-500">{patient.age_range} anos</span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="h-3 w-3" /> {timeInTherapy(patient.created_at)} em terapia
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Activity className="h-3 w-3" /> {sessions.length} sessões
                  </span>
                  {attnCfg && (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${attnCfg.badge}`}>
                      <AlertTriangle className="h-2.5 w-2.5" /> {attnCfg.label}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/pacientes/${patient.id}/progressao`}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:-translate-y-0.5 transition-all">
                  <TrendingUp className="h-4 w-4" /> Progressão
                </Link>
                <Link
                  href={`/nova-analise?patient=${patient.id}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(37,99,235,0.25)] hover:bg-blue-500 hover:-translate-y-0.5 transition-all">
                  <PlusCircle className="h-4 w-4" /> Nova análise
                </Link>
              </div>
            </div>

            {/* Metadata grid */}
            {metaFields.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-50 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
                {metaFields.map(f => (
                  <MetaChip key={f.label} icon={f.icon} label={f.label} value={f.value} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Entry reason */}
        {patient.entry_reason && (
          <div className="px-5 pb-5">
            <div className="rounded-xl bg-slate-50 px-4 py-3 border-l-2 border-blue-400">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Motivo de entrada</p>
              <p className="text-sm text-slate-600 leading-relaxed">{patient.entry_reason}</p>
            </div>
          </div>
        )}
      </div>

      {/* Linha do tempo */}
      <div>
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
          Linha do tempo
        </h2>
        {loading ? <div className="h-14 rounded-2xl bg-slate-100 animate-pulse" /> : <Timeline history={attentionHistory} />}
      </div>

      {/* Memória clínica */}
      <div>
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
          Memória clínica
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <EditableList title="Hipóteses confirmadas" icon={Brain} accentClass="text-blue-600"
            items={memory?.confirmed_hypotheses || []} placeholder="Adicionar hipótese confirmada..."
            onSave={items => updateMemoryField('confirmed_hypotheses', items)} />
          <EditableList title="O que funcionou" icon={CheckCircle2} accentClass="text-emerald-600"
            items={memory?.what_worked || []} placeholder="Adicionar o que funcionou..."
            onSave={items => updateMemoryField('what_worked', items)} />
          <EditableList title="Padrões recorrentes" icon={TrendingUp} accentClass="text-amber-600"
            items={memory?.recurring_patterns || []} placeholder="Adicionar padrão observado..."
            onSave={items => updateMemoryField('recurring_patterns', items)} />
          <EditableList title="Temas centrais" icon={BookOpen} accentClass="text-violet-600"
            items={memory?.central_themes || []} placeholder="Adicionar tema central..."
            onSave={items => updateMemoryField('central_themes', items)} />
          <EditableList title="Hipóteses descartadas" icon={X} accentClass="text-slate-400"
            items={memory?.discarded_hypotheses || []} placeholder="Adicionar hipótese descartada..."
            onSave={items => updateMemoryField('discarded_hypotheses', items)} />
          <EditableList title="O que não funcionou" icon={Zap} accentClass="text-rose-500"
            items={memory?.what_didnt_work || []} placeholder="Adicionar o que não funcionou..."
            onSave={items => updateMemoryField('what_didnt_work', items)} />
        </div>
      </div>

      {/* Histórico de sessões */}
      <div>
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
          Histórico de sessões
        </h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-14 rounded-2xl bg-slate-100 animate-pulse" />)}
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-10 gap-2">
            <p className="text-sm text-slate-400">Nenhuma sessão registrada ainda.</p>
            <Link href={`/nova-analise?patient=${patient.id}`}
              className="text-sm text-blue-600 hover:text-blue-500 transition-colors">
              Criar primeira análise →
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-white px-5 shadow-sm">
            {[...sessions].reverse().map(session => (
              <SessionItem key={session.id} session={session}
                caseTitle={session.analysis_id ? (caseTitles[session.analysis_id] || null) : null} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
