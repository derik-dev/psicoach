'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useApp, PatientMemory, PatientSession, AttentionHistoryEntry, CaseAnalysis } from '@/context/AppContext';
import { supabase } from '@/lib/supabase/client';
import { appendUnique, extractFirstParagraph, extractFirstSentence } from '@/lib/memory-utils';
import {
  ArrowLeft, PlusCircle, Brain, CheckCircle2, TrendingUp,
  BookOpen, Clock, Activity, AlertTriangle, X, Zap,
  CalendarDays, ChevronRight, RefreshCw, ChevronDown, Save, Check,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

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

const LEVEL_TO_NUM: Record<string, number> = { baixo: 1, moderado: 2, alto: 3 };
const NUM_TO_LABEL: Record<number, string> = { 1: 'Baixo', 2: 'Moderado', 3: 'Alto' };

const AVATAR_COLORS = [
  'from-blue-500 to-indigo-600', 'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600', 'from-orange-500 to-rose-500',
  'from-cyan-500 to-blue-600',
];
function avatarGradient(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

/* ── MemoryCard — count badge + truncation + "Ver todos" ── */

function MemoryCard({
  title, icon: Icon, items, accentClass, emptyText,
}: {
  title: string;
  icon: React.ElementType;
  items: string[];
  accentClass: string;
  emptyText: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const LIMIT = 5;
  const visible = expanded ? items : items.slice(0, LIMIT);
  const hasMore = items.length > LIMIT;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm flex flex-col gap-3 h-full">
      <div className={`flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest ${accentClass}`}>
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5" />
          {title}
        </div>
        {items.length > 0 && (
          <span className="rounded-full bg-current/10 px-1.5 py-0.5 text-[10px] font-bold tabular-nums">
            {items.length}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-[11px] text-slate-400 italic">{emptyText}</p>
      ) : (
        <>
          <ul className="space-y-1.5">
            {visible.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
                <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5 opacity-40" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          {hasMore && (
            <button
              onClick={() => setExpanded(e => !e)}
              className={`flex items-center gap-1 text-[10px] font-semibold transition-colors ${accentClass}`}
            >
              {expanded ? 'Mostrar menos' : `Ver todos (${items.length})`}
              <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          )}
        </>
      )}
    </div>
  );
}

/* ── NotesCard — free-text notepad for manual memory fields ── */

function NotesCard({
  title, icon: Icon, accentClass, value, onSave,
}: {
  title: string;
  icon: React.ElementType;
  accentClass: string;
  value: string[];
  onSave: (text: string) => Promise<void>;
}) {
  const text = value.join('\n');
  const [draft, setDraft] = useState(text);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setDraft(value.join('\n')); }, [value]);

  const handleChange = (val: string) => {
    setDraft(val);
    setSaved(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setSaving(true);
      await onSave(val);
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 800);
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm flex flex-col gap-3 h-full min-h-[160px]">
      <div className={`flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest ${accentClass}`}>
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5" />
          {title}
        </div>
        {saving && <span className="text-[9px] text-slate-400 normal-case tracking-normal font-normal">salvando…</span>}
        {saved && !saving && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
      </div>
      <textarea
        value={draft}
        onChange={e => handleChange(e.target.value)}
        placeholder="Anote livremente o que funcionou neste caso…"
        className="flex-1 w-full resize-none bg-transparent text-xs text-slate-700 leading-relaxed placeholder-slate-300 outline-none min-h-[100px]"
      />
    </div>
  );
}

/* ── SessionRow — inline note editing ── */

function SessionRow({
  session, caseTitle, nivel, onNoteSaved,
}: {
  session: PatientSession;
  caseTitle: string | null;
  nivel: string | null;
  onNoteSaved: (sessionId: string, note: string) => void;
}) {
  const cfg = nivel ? attentionColor(nivel) : null;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(session.therapist_notes || '');
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) textareaRef.current?.focus();
  }, [editing]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase
        .from('sessions')
        .update({ therapist_notes: draft.trim() })
        .eq('id', session.id);
      onNoteSaved(session.id, draft.trim());
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(session.therapist_notes || '');
    setEditing(false);
  };

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
          {caseTitle && <span className="text-[11px] text-slate-400 truncate max-w-[160px]">{caseTitle}</span>}
          {cfg && (
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.badge}`}>
              <AlertTriangle className="h-2.5 w-2.5" /> {cfg.label}
            </span>
          )}
        </div>

        {editing ? (
          <div className="mt-2 space-y-2">
            <textarea
              ref={textareaRef}
              rows={3}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="O que aconteceu nessa sessão?"
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 text-white text-[11px] font-semibold hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                {saving ? <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Save className="h-3 w-3" />}
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 text-[11px] font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setEditing(true)}
            className="mt-1 w-full cursor-text group/note"
          >
            {session.therapist_notes ? (
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 group-hover/note:text-slate-700 transition-colors">
                {session.therapist_notes}
              </p>
            ) : (
              <p className="text-[11px] text-slate-300 italic group-hover/note:text-blue-400 transition-colors">
                Clique para adicionar anotação…
              </p>
            )}
          </div>
        )}
      </div>

      {session.analysis_id && !editing && (
        <Link
          href={`/historico/${session.analysis_id}`}
          className="shrink-0 flex items-center gap-0.5 text-[11px] font-semibold text-blue-600 hover:text-blue-500 transition-colors"
        >
          Ver análise <ChevronRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

/* ── Tooltip ── */

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number }> }) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  const cfg = attentionColor(val === 3 ? 'alto' : val === 2 ? 'moderado' : 'baixo');
  return (
    <div className="rounded-xl bg-slate-800 text-white px-3 py-2 text-[11px] shadow-xl">
      <span className={`font-semibold ${cfg.badge.split(' ')[1]}`}>{cfg.label}</span>
    </div>
  );
}

/* ── Main page ── */

export default function ProgressaoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { patients } = useApp();
  const patient = patients.find(p => p.id === id);

  const [memory, setMemory] = useState<PatientMemory | null>(null);
  const [sessions, setSessions] = useState<PatientSession[]>([]);
  const [caseTitles, setCaseTitles] = useState<Record<string, string>>({});
  const [caseNiveis, setCaseNiveis] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

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
          supabase.from('cases').select('id, title, analysis').in('id', analysisIds).then(({ data }) => {
            if (data) {
              const titles: Record<string, string> = {};
              const niveis: Record<string, string> = {};
              for (const c of data) {
                titles[c.id] = c.title || 'Sem título';
                const analysis = c.analysis as { nivel_atencao?: string } | null;
                if (analysis?.nivel_atencao) niveis[c.id] = analysis.nivel_atencao;
              }
              setCaseTitles(titles);
              setCaseNiveis(niveis);
            }
          });
        }
      }
    }).finally(() => setLoading(false));
  }, [id]);

  const saveManualField = async (field: 'what_worked' | 'what_didnt_work', text: string) => {
    if (!id) return;
    const items = text.split('\n').map(l => l.trim()).filter(Boolean);
    const payload = { [field]: items, updated_at: new Date().toISOString() };
    if (memory?.id) {
      await supabase.from('patient_memory').update(payload).eq('patient_id', id);
      setMemory(prev => prev ? { ...prev, [field]: items } : null);
    } else {
      const { data } = await supabase.from('patient_memory')
        .insert({ patient_id: id, ...payload }).select('*').single();
      if (data) setMemory(data as PatientMemory);
    }
  };

  const handleNoteSaved = (sessionId: string, note: string) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, therapist_notes: note } : s));
  };

  const handleSyncMemory = async () => {
    if (!id) return;
    setSyncing(true);
    setSyncDone(false);
    try {
      const { data: sessData } = await supabase
        .from('sessions')
        .select('analysis_id, session_number, created_at')
        .eq('patient_id', id)
        .not('analysis_id', 'is', null)
        .order('session_number', { ascending: true });

      if (!sessData?.length) return;

      const analysisIds = sessData.map(s => s.analysis_id as string);
      const { data: casesData } = await supabase
        .from('cases')
        .select('id, analysis, created_at')
        .in('id', analysisIds);

      if (!casesData?.length) return;

      let confirmedHyps: string[] = memory?.confirmed_hypotheses || [];
      let patterns: string[] = memory?.recurring_patterns || [];
      let themes: string[] = memory?.central_themes || [];
      const attHistory: AttentionHistoryEntry[] = [];

      const caseMap = new Map(casesData.map(c => [c.id as string, c]));

      for (const sess of sessData) {
        const caseData = caseMap.get(sess.analysis_id as string);
        if (!caseData) continue;
        const analysis = caseData.analysis as CaseAnalysis;

        const hyp = extractFirstParagraph((analysis as unknown as { hipotese_central?: string }).hipotese_central || analysis.hypothesis || '');
        if (hyp) confirmedHyps = appendUnique(confirmedHyps, [hyp]);

        const factors = ((analysis as unknown as { fatores_relevantes?: string[] }).fatores_relevantes || []).map(f => f.trim()).filter(Boolean);
        patterns = appendUnique(patterns, factors);

        const theme = extractFirstSentence((analysis as unknown as { sintese?: string }).sintese || '');
        if (theme) themes = appendUnique(themes, [theme]);

        attHistory.push({
          date: caseData.created_at as string,
          level: (analysis.nivel_atencao || 'baixo') as AttentionHistoryEntry['level'],
          session_number: sess.session_number as number,
        });
      }

      const payload = {
        confirmed_hypotheses: confirmedHyps,
        recurring_patterns: patterns,
        central_themes: themes,
        attention_history: attHistory,
        updated_at: new Date().toISOString(),
      };

      if (memory?.id) {
        await supabase.from('patient_memory').update(payload).eq('patient_id', id);
        setMemory(prev => prev ? { ...prev, ...payload } : null);
      } else {
        const { data } = await supabase
          .from('patient_memory')
          .insert({ patient_id: id, ...payload })
          .select('*')
          .single();
        if (data) setMemory(data as PatientMemory);
      }

      setSyncDone(true);
      setTimeout(() => setSyncDone(false), 3000);
    } finally {
      setSyncing(false);
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

  const chartData = attentionHistory.map(h => ({
    sessao: `S${h.session_number}`,
    nivel: LEVEL_TO_NUM[h.level] ?? 1,
  }));

  function dotColor(value: number) {
    if (value === 3) return '#f43f5e';
    if (value === 2) return '#f59e0b';
    return '#10b981';
  }

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      {/* Header */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        {attnCfg && <div className={`h-1 w-full ${attnCfg.dot}`} />}
        <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${avatarGradient(patient.pseudonym)} flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-sm`}>
            {patient.pseudonym.slice(0, 2).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-800">{patient.pseudonym}</h1>
            <div className="flex items-center gap-3 flex-wrap mt-1">
              {patient.age_range && <span className="text-xs text-slate-500">{patient.age_range} anos</span>}
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Activity className="h-3 w-3" /> {sessions.length} sessões
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="h-3 w-3" /> {timeInTherapy(patient.created_at)} em acompanhamento
              </span>
              {attnCfg && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${attnCfg.badge}`}>
                  <AlertTriangle className="h-2.5 w-2.5" /> {attnCfg.label}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={handleSyncMemory}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition-all"
              title="Sincronizar memória com todas as análises vinculadas"
            >
              {syncing ? (
                <span className="h-3.5 w-3.5 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" />
              ) : syncDone ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              {syncing ? 'Sincronizando…' : syncDone ? 'Sincronizado!' : 'Sincronizar memória'}
            </button>
            <Link
              href={`/nova-analise?patient=${patient.id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(37,99,235,0.25)] hover:bg-blue-500 hover:-translate-y-0.5 transition-all"
            >
              <PlusCircle className="h-4 w-4" /> Nova análise
            </Link>
          </div>
        </div>
      </div>

      {/* Linha do tempo */}
      <section>
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Linha do tempo</h2>
        {loading ? (
          <div className="h-16 rounded-2xl bg-slate-100 animate-pulse" />
        ) : attentionHistory.length === 0 ? (
          <div className="flex items-center justify-center h-14 rounded-2xl border border-dashed border-slate-200 bg-white">
            <p className="text-xs text-slate-400">Nenhuma sessão com análise registrada ainda.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm overflow-x-auto">
            <div className="flex items-center gap-0 min-w-max">
              {attentionHistory.map((entry, i) => {
                const cfg = attentionColor(entry.level);
                const linkedSession = sessions.find(s => s.session_number === entry.session_number);
                const analysisId = linkedSession?.analysis_id;
                const dot = (
                  <div className="flex flex-col items-center gap-1.5 group relative">
                    <div className={`w-4 h-4 rounded-full ${cfg.dot} cursor-pointer transition-transform group-hover:scale-125`} />
                    <span className="text-[9px] text-slate-400 font-medium">S{entry.session_number}</span>
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 min-w-[140px]">
                      <div className="rounded-xl bg-slate-800 text-white px-3 py-2 text-[10px] text-center shadow-xl">
                        <p className="font-semibold">Sessão {entry.session_number}</p>
                        <p className={`mt-0.5 font-medium ${cfg.badge.split(' ')[1]}`}>{cfg.label}</p>
                        <p className="text-slate-400 mt-0.5">{new Date(entry.date).toLocaleDateString('pt-BR')}</p>
                        {analysisId && <p className="text-blue-400 mt-0.5">Clique para ver →</p>}
                      </div>
                    </div>
                  </div>
                );
                return (
                  <React.Fragment key={i}>
                    {analysisId ? <Link href={`/historico/${analysisId}`}>{dot}</Link> : dot}
                    {i < attentionHistory.length - 1 && <div className="w-8 h-px bg-slate-200 shrink-0" />}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Gráfico */}
      {chartData.length > 1 && (
        <section>
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Evolução do nível de atenção</h2>
          <div className="rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-sm">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="sessao" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis
                  domain={[0.5, 3.5]} ticks={[1, 2, 3]}
                  tickFormatter={(v) => NUM_TO_LABEL[v] || ''}
                  tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone" dataKey="nivel" stroke="#2563eb" strokeWidth={2}
                  dot={(props) => {
                    const { cx, cy, payload } = props as { cx: number; cy: number; payload: { nivel: number } };
                    return <circle key={`d-${cx}`} cx={cx} cy={cy} r={5} fill={dotColor(payload.nivel)} stroke="white" strokeWidth={2} />;
                  }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Memória clínica */}
      <section>
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Memória clínica atual</h2>
        {loading ? (
          <div className="grid grid-cols-2 gap-3">{[1, 2, 3, 4].map(i => <div key={i} className="h-32 rounded-2xl bg-slate-100 animate-pulse" />)}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <MemoryCard title="Hipóteses confirmadas" icon={Brain} accentClass="text-blue-600"
              items={memory?.confirmed_hypotheses || []} emptyText="Nenhuma hipótese confirmada ainda." />
            <NotesCard title="O que funcionou" icon={CheckCircle2} accentClass="text-emerald-600"
              value={memory?.what_worked || []} onSave={text => saveManualField('what_worked', text)} />
            <MemoryCard title="Padrões recorrentes" icon={TrendingUp} accentClass="text-amber-600"
              items={memory?.recurring_patterns || []} emptyText="Nenhum padrão registrado ainda." />
            <MemoryCard title="Temas centrais" icon={BookOpen} accentClass="text-violet-600"
              items={memory?.central_themes || []} emptyText="Nenhum tema registrado ainda." />
          </div>
        )}
      </section>

      {/* Descartados */}
      {(memory?.discarded_hypotheses?.length || memory?.what_didnt_work?.length) ? (
        <section>
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Descartados</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MemoryCard title="Hipóteses descartadas" icon={X} accentClass="text-slate-400"
              items={memory?.discarded_hypotheses || []} emptyText="Nenhuma hipótese descartada." />
            <NotesCard title="O que não funcionou" icon={Zap} accentClass="text-rose-500"
              value={memory?.what_didnt_work || []} onSave={text => saveManualField('what_didnt_work', text)} />
          </div>
        </section>
      ) : null}

      {/* Histórico de sessões */}
      <section>
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Histórico de sessões</h2>
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-14 rounded-2xl bg-slate-100 animate-pulse" />)}</div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-10 gap-2">
            <CalendarDays className="h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-400">Nenhuma sessão registrada ainda.</p>
            <Link href={`/nova-analise?patient=${patient.id}`} className="text-sm text-blue-600 hover:text-blue-500 transition-colors">
              Criar primeira análise →
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-white px-5 shadow-sm">
            {[...sessions].reverse().map(session => {
              const nivel = session.analysis_id ? (caseNiveis[session.analysis_id] || null) : null;
              return (
                <SessionRow
                  key={session.id}
                  session={session}
                  caseTitle={session.analysis_id ? (caseTitles[session.analysis_id] || null) : null}
                  nivel={nivel}
                  onNoteSaved={handleNoteSaved}
                />
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
