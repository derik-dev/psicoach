'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp, Patient } from '@/context/AppContext';
import { supabase } from '@/lib/supabase/client';
import {
  Users, UserPlus, Search, X, ChevronRight,
  Clock, Activity, Trash2, Check,
  User, Calendar, Stethoscope, Brain, FileText, ArrowLeft,
  Pill, Share2, History,
} from 'lucide-react';

/* ── New Patient Form (inline) ── */

const EMPTY_FORM = {
  pseudonym: '', age_range: '', gender: '', initial_diagnosis: '',
  referral_source: '', medication_use: '', entry_reason: '', approach: '',
  sessions_count: '',
  // legacy fields kept for compat
  occupation: '', marital_status: '',
  previous_therapy: null as boolean | null, previous_therapy_notes: '',
  medication: '',
};

const inputBase = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100";
const selectBase = `${inputBase} appearance-none cursor-pointer`;

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-2">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">{children}</p>
    </div>
  );
}

function Field({ label, icon, required, hint, children }: { label: string; icon: React.ReactNode; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        <span className="text-slate-400">{icon}</span>
        {label}
        {required && <span className="text-rose-400 normal-case tracking-normal text-[11px]">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-slate-400">{hint}</p>}
    </div>
  );
}

function NewPatientForm({ onCancel, onSave }: { onCancel: () => void; onSave: (p: Patient) => void }) {
  const { addPatient } = useApp();
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pseudonym.trim()) { setError('Pseudônimo é obrigatório.'); return; }
    setSaving(true);
    try {
      const patient = await addPatient({
        pseudonym: form.pseudonym.trim(),
        age_range: form.age_range.trim(),
        gender: form.gender,
        occupation: form.occupation,
        marital_status: form.marital_status,
        entry_reason: form.entry_reason.trim(),
        initial_diagnosis: form.initial_diagnosis.trim(),
        approach: form.approach.trim(),
        previous_therapy: form.previous_therapy,
        previous_therapy_notes: form.previous_therapy_notes,
        medication: form.medication,
        referral_source: form.referral_source,
        medication_use: form.medication_use,
        sessions_count: form.sessions_count,
      });
      onSave(patient);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onCancel}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
      </div>

      <div>
        <h1 className="page-headline">
          Novo <span className="page-headline-accent">paciente.</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">Dados clínicos iniciais — use pseudônimo para preservar a identidade.</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-5">

        {/* 1. Pseudônimo */}
        <Field label="Pseudônimo" icon={<User className="h-3 w-3" />} required
          hint="Use um apelido ou código — nunca o nome real.">
          <input type="text" value={form.pseudonym} onChange={set('pseudonym')} required
            autoFocus placeholder="Ex: Marcos, Paciente A, Mulher 35..."
            className={inputBase} />
        </Field>

        {/* 2+4. Faixa etária | Diagnóstico CID */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Faixa etária" icon={<Calendar className="h-3 w-3" />}>
            <input type="text" value={form.age_range} onChange={set('age_range')} placeholder="Ex: 30-40"
              className={inputBase} />
          </Field>
          <Field label="Diagnóstico CID" icon={<Stethoscope className="h-3 w-3" />}>
            <input type="text" value={form.initial_diagnosis} onChange={set('initial_diagnosis')} placeholder="Ex: F41.1"
              className={inputBase} />
          </Field>
        </div>

        {/* 3+5. Gênero | Como chegou à terapia */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Gênero" icon={<User className="h-3 w-3" />}>
            <select value={form.gender} onChange={set('gender')} className={selectBase}>
              <option value="">Selecionar...</option>
              <option value="Feminino">Feminino</option>
              <option value="Masculino">Masculino</option>
              <option value="Não-binário">Não-binário</option>
              <option value="Prefiro não informar">Prefiro não informar</option>
            </select>
          </Field>
          <Field label="Como chegou à terapia" icon={<Share2 className="h-3 w-3" />}>
            <select value={form.referral_source} onChange={set('referral_source')} className={selectBase}>
              <option value="">Selecionar...</option>
              <option value="Conta própria">Conta própria</option>
              <option value="Indicação de familiar/amigo">Indicação de familiar/amigo</option>
              <option value="Indicação médica/psiquiátrica">Indicação médica/psiquiátrica</option>
              <option value="Escola/trabalho">Escola/trabalho</option>
              <option value="Outro">Outro</option>
            </select>
          </Field>
        </div>

        {/* 6. Uso de medicação psiquiátrica */}
        <Field label="Uso de medicação psiquiátrica" icon={<Pill className="h-3 w-3" />}>
          <select value={form.medication_use} onChange={set('medication_use')} className={selectBase}>
            <option value="">Selecionar...</option>
            <option value="Não">Não</option>
            <option value="Sim">Sim</option>
            <option value="Não informado">Não informado</option>
          </select>
        </Field>

        {/* 7. Motivo de entrada */}
        <Field label="Motivo de entrada" icon={<FileText className="h-3 w-3" />}>
          <textarea value={form.entry_reason} onChange={set('entry_reason')}
            placeholder="Descreva brevemente a queixa principal e o contexto de chegada..."
            rows={4} className={`${inputBase} resize-none`} />
        </Field>

        {/* 8. Abordagem terapêutica */}
        <Field label="Abordagem terapêutica" icon={<Brain className="h-3 w-3" />}>
          <input type="text" value={form.approach} onChange={set('approach')} placeholder="Ex: TCC, Psicanálise, Gestalt..."
            className={inputBase} />
        </Field>

        {/* 9. Sessões já realizadas */}
        <Field label="Sessões já realizadas" icon={<History className="h-3 w-3" />}
          hint="Preencha se estiver cadastrando um paciente já em acompanhamento">
          <select value={form.sessions_count} onChange={set('sessions_count')} className={selectBase}>
            <option value="">Selecionar...</option>
            <option value="Primeira sessão">Primeira sessão</option>
            <option value="2-5 sessões">2-5 sessões</option>
            <option value="6-15 sessões">6-15 sessões</option>
            <option value="16-30 sessões">16-30 sessões</option>
            <option value="Mais de 30 sessões">Mais de 30 sessões</option>
          </select>
        </Field>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-100 px-3 py-2">
            <X className="h-3.5 w-3.5 text-rose-500 shrink-0" />
            <p className="text-xs text-rose-600">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onCancel}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
            Cancelar
          </button>
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition shadow-[0_4px_14px_rgba(37,99,235,0.3)]">
            {saving ? (
              <>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Cadastrar paciente
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ── Attention badge ── */

function AttentionBadge({ level }: { level: 'baixo' | 'moderado' | 'alto' | null }) {
  if (!level) return null;
  const cfg = {
    baixo: 'bg-emerald-100 text-emerald-700',
    moderado: 'bg-amber-100 text-amber-700',
    alto: 'bg-rose-100 text-rose-700',
  }[level];
  const labels = { baixo: 'Baixa atenção', moderado: 'Atenção moderada', alto: 'Alta atenção' };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg}`}>
      <Activity className="h-2.5 w-2.5" />
      {labels[level]}
    </span>
  );
}

/* ── Patient card ── */

interface PatientCardProps {
  patient: Patient;
  sessionCount: number;
  lastSessionDate: string | null;
  lastAttention: 'baixo' | 'moderado' | 'alto' | null;
  onDelete: (id: string) => void;
}

const AVATAR_COLORS = [
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-rose-500',
  'from-cyan-500 to-blue-600',
];

function avatarColor(name: string) {
  const i = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[i];
}

function PatientCard({ patient, sessionCount, lastSessionDate, lastAttention, onDelete }: PatientCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const createdAt = new Date(patient.created_at);
  const diffMs = Date.now() - createdAt.getTime();
  const weeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  const timeLabel = weeks === 0 ? '< 1 semana' : weeks >= 8 ? `${Math.round(weeks / 4)} meses` : `${weeks} sem.`;

  const attentionDot = lastAttention === 'alto' ? 'bg-rose-500' : lastAttention === 'moderado' ? 'bg-amber-400' : null;

  return (
    <div className="group rounded-2xl border border-slate-100 bg-white flex flex-col overflow-hidden hover:border-slate-200 hover:shadow-lg transition-all duration-200">

      {/* Top strip */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`relative w-11 h-11 rounded-xl bg-gradient-to-br ${avatarColor(patient.pseudonym)} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm`}>
            {patient.pseudonym.slice(0, 2).toUpperCase()}
            {attentionDot && (
              <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${attentionDot} ring-2 ring-white`} />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-800 truncate leading-tight">{patient.pseudonym}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
              {[patient.age_range && `${patient.age_range} anos`, patient.gender].filter(Boolean).join(' · ') || 'Sem detalhes'}
            </p>
          </div>
        </div>

        {confirmDelete ? (
          <div className="flex gap-1 shrink-0">
            <button onClick={() => onDelete(patient.id)}
              className="p-1.5 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors">
              <Check className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setConfirmDelete(false)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded-lg text-slate-200 hover:text-rose-500 hover:bg-rose-50 transition-colors shrink-0 opacity-0 group-hover:opacity-100">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Tags */}
      {(patient.approach || lastAttention) && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {lastAttention && <AttentionBadge level={lastAttention} />}
          {patient.approach && (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
              {patient.approach}
            </span>
          )}
        </div>
      )}

      {/* Entry reason snippet */}
      {patient.entry_reason && (
        <div className="mx-4 mb-3 rounded-xl bg-slate-50 px-3 py-2">
          <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{patient.entry_reason}</p>
        </div>
      )}

      {/* Divider */}
      <div className="mx-4 border-t border-slate-100" />

      {/* Stats row */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <Activity className="h-3 w-3 text-slate-400" />
          <span><span className="font-semibold text-slate-700">{sessionCount}</span> sessões</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <Clock className="h-3 w-3 text-slate-400" />
          <span>{timeLabel} em terapia</span>
        </div>
        {lastSessionDate && (
          <span className="text-[10px] text-slate-400 hidden sm:block">
            {new Date(lastSessionDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </span>
        )}
      </div>

      {/* Footer CTA */}
      <Link
        href={`/pacientes/${patient.id}`}
        className="mx-3 mb-3 flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 py-2.5 text-[13px] font-semibold text-white hover:bg-slate-700 transition-colors"
      >
        Ver perfil <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

/* ── Main Page ── */

interface PatientStats {
  sessionCount: number;
  lastSessionDate: string | null;
  lastAttention: 'baixo' | 'moderado' | 'alto' | null;
}

export default function PacientesPage() {
  const { patients, deletePatient } = useApp();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [stats, setStats] = useState<Record<string, PatientStats>>({});

  React.useEffect(() => {
    if (patients.length === 0) return;
    const ids = patients.map(p => p.id);
    supabase
      .from('sessions')
      .select('patient_id, created_at')
      .in('patient_id', ids)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, PatientStats> = {};
        for (const session of data) {
          if (!map[session.patient_id]) {
            map[session.patient_id] = { sessionCount: 0, lastSessionDate: session.created_at, lastAttention: null };
          }
          map[session.patient_id].sessionCount += 1;
        }
        setStats(map);
      });

    supabase
      .from('patient_memory')
      .select('patient_id, attention_history')
      .in('patient_id', ids)
      .then(({ data }) => {
        if (!data) return;
        setStats(prev => {
          const next = { ...prev };
          for (const mem of data) {
            const history = (mem.attention_history || []) as { level: string; session_number: number }[];
            if (history.length > 0) {
              const last = history[history.length - 1];
              if (!next[mem.patient_id]) {
                next[mem.patient_id] = { sessionCount: 0, lastSessionDate: null, lastAttention: null };
              }
              next[mem.patient_id].lastAttention = last.level as 'baixo' | 'moderado' | 'alto';
            }
          }
          return next;
        });
      });
  }, [patients]);

  const filtered = patients.filter(p =>
    p.pseudonym.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    try { await deletePatient(id); } catch { /* silent */ }
  };

  if (showForm) {
    return (
      <NewPatientForm
        onCancel={() => setShowForm(false)}
        onSave={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-headline">
            Meus <span className="page-headline-accent">pacientes.</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {patients.length === 0
              ? 'Cadastre pacientes para vincular análises e acompanhar o progresso.'
              : `${patients.length} paciente${patients.length > 1 ? 's' : ''} em acompanhamento.`}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)] hover:bg-blue-500 hover:-translate-y-0.5 transition-all shrink-0"
        >
          <UserPlus className="h-4 w-4" /> Novo paciente
        </button>
      </div>

      {/* Search */}
      {patients.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por pseudônimo..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {patients.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_12px_28px_rgba(37,99,235,0.28)]">
            <Users className="h-7 w-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">Nenhum paciente cadastrado</h3>
          <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-slate-500">
            Cadastre seus pacientes para vincular análises e construir memória clínica ao longo do tempo.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.28)] hover:bg-blue-500 transition-all"
          >
            <UserPlus className="h-4 w-4" /> Cadastrar primeiro paciente
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">Nenhum paciente encontrado para &ldquo;{search}&rdquo;.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(patient => (
            <PatientCard
              key={patient.id}
              patient={patient}
              sessionCount={stats[patient.id]?.sessionCount || 0}
              lastSessionDate={stats[patient.id]?.lastSessionDate || null}
              lastAttention={stats[patient.id]?.lastAttention || null}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
