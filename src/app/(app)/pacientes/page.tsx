'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp, Patient } from '@/context/AppContext';
import { supabase } from '@/lib/supabase/client';
import {
  Users, UserPlus, Search, X, ChevronRight,
  Clock, Activity, Trash2, Check,
} from 'lucide-react';

/* ── New Patient Modal ── */

const EMPTY_FORM = { pseudonym: '', age_range: '', entry_reason: '', initial_diagnosis: '', approach: '' };

function NewPatientModal({ onClose, onSave }: { onClose: () => void; onSave: (p: Patient) => void }) {
  const { addPatient } = useApp();
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pseudonym.trim()) { setError('Pseudônimo é obrigatório.'); return; }
    setSaving(true);
    try {
      const patient = await addPatient({
        pseudonym: form.pseudonym.trim(),
        age_range: form.age_range.trim(),
        entry_reason: form.entry_reason.trim(),
        initial_diagnosis: form.initial_diagnosis.trim(),
        approach: form.approach.trim(),
      });
      onSave(patient);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-800">Novo paciente</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Pseudônimo <span className="text-rose-500">*</span>
            </label>
            <input type="text" value={form.pseudonym} onChange={set('pseudonym')} required
              placeholder="Ex: Marcos, Paciente A..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Faixa etária</label>
              <input type="text" value={form.age_range} onChange={set('age_range')} placeholder="Ex: 30-40"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Diagnóstico</label>
              <input type="text" value={form.initial_diagnosis} onChange={set('initial_diagnosis')} placeholder="Ex: F41.1"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Motivo de entrada</label>
            <input type="text" value={form.entry_reason} onChange={set('entry_reason')} placeholder="Ex: Ansiedade, conflitos relacionais..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Abordagem</label>
            <input type="text" value={form.approach} onChange={set('approach')} placeholder="Ex: TCC, Psicanálise..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          </div>
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-[2] rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
              {saving ? 'Salvando...' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
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

function PatientCard({ patient, sessionCount, lastSessionDate, lastAttention, onDelete }: PatientCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const createdAt = new Date(patient.created_at);
  const diffMs = Date.now() - createdAt.getTime();
  const weeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  const timeLabel = weeks === 0 ? 'menos de 1 semana' : weeks >= 8 ? `${Math.round(weeks / 4)} meses` : `${weeks} semanas`;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col gap-3 hover:border-blue-200 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
            {patient.pseudonym.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-800 truncate">{patient.pseudonym}</h3>
            {patient.age_range && (
              <p className="text-[11px] text-slate-400">{patient.age_range} anos</p>
            )}
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
            className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors shrink-0">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {lastAttention && <AttentionBadge level={lastAttention} />}
        {patient.approach && (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
            {patient.approach}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-xl bg-slate-50 py-2">
          <p className="text-lg font-bold text-slate-800">{sessionCount}</p>
          <p className="text-[10px] text-slate-400 font-medium">sessões</p>
        </div>
        <div className="rounded-xl bg-slate-50 py-2">
          <p className="text-[11px] font-semibold text-slate-700 flex items-center justify-center gap-1">
            <Clock className="h-3 w-3 text-slate-400" /> {timeLabel}
          </p>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">em terapia</p>
        </div>
      </div>

      {lastSessionDate && (
        <p className="text-[10px] text-slate-400">
          Última sessão: {new Date(lastSessionDate).toLocaleDateString('pt-BR')}
        </p>
      )}

      <Link
        href={`/pacientes/${patient.id}`}
        className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
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
  const [showModal, setShowModal] = useState(false);
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
          onClick={() => setShowModal(true)}
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
            onClick={() => setShowModal(true)}
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

      {showModal && (
        <NewPatientModal
          onClose={() => setShowModal(false)}
          onSave={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
