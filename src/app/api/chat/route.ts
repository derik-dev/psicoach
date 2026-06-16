import { NextRequest } from 'next/server';
import { groq, GROQ_MODEL, PatientMemoryContext } from '@/lib/groq';
import { getAuthenticatedUser, createAdminClient } from '@/lib/supabase/server';

function buildPatientBlock(mem: PatientMemoryContext): string {
  const lines: string[] = [];

  const sessionLabel = mem.sessions_count > 0
    ? `${mem.sessions_count} sessões registradas`
    : 'primeira sessão';

  lines.push(`PACIENTE EM CONTEXTO — ${mem.pseudonym} (${sessionLabel})`);
  lines.push('');
  lines.push('Este paciente já está em acompanhamento. Use o histórico abaixo para personalizar sua supervisão — identifique padrões, compare com sessões anteriores e ofereça perspectivas que considerem a evolução do caso.');
  lines.push('');

  if (mem.gender) lines.push(`Gênero: ${mem.gender}`);
  if (mem.referral_source) lines.push(`Como chegou: ${mem.referral_source}`);
  if (mem.medication_use) lines.push(`Medicação: ${mem.medication_use}`);
  if (mem.weeks_in_therapy > 0) {
    const w = mem.weeks_in_therapy;
    lines.push(`Tempo em terapia: ${w >= 8 ? `${Math.round(w / 4)} meses` : `${w} semanas`}`);
  }
  if (mem.intake_sessions_count) lines.push(`Sessões informadas no cadastro: ${mem.intake_sessions_count}`);
  lines.push(`Sessões realizadas: ${mem.sessions_count}`);

  if (mem.confirmed_hypotheses.length > 0)
    lines.push(`Hipóteses confirmadas: ${mem.confirmed_hypotheses.join('; ')}`);
  if (mem.discarded_hypotheses.length > 0)
    lines.push(`Hipóteses descartadas: ${mem.discarded_hypotheses.join('; ')}`);
  if (mem.what_worked.length > 0)
    lines.push(`O que funcionou: ${mem.what_worked.join('; ')}`);
  if (mem.what_didnt_work.length > 0)
    lines.push(`O que não funcionou: ${mem.what_didnt_work.join('; ')}`);
  if (mem.recurring_patterns.length > 0)
    lines.push(`Padrões recorrentes: ${mem.recurring_patterns.join('; ')}`);
  if (mem.central_themes.length > 0)
    lines.push(`Temas centrais: ${mem.central_themes.join('; ')}`);
  if (mem.attention_history.length > 0) {
    const hist = mem.attention_history.map(h => `Sessão ${h.session_number}: ${h.level}`).join(' → ');
    lines.push(`Evolução do nível de atenção: ${hist}`);
  }
  if (mem.last_session_notes?.trim())
    lines.push(`Nota da última sessão: ${mem.last_session_notes.trim()}`);

  if (mem.previous_relatos && mem.previous_relatos.length > 0) {
    lines.push('');
    lines.push('RELATOS DAS ÚLTIMAS SESSÕES:');
    for (const r of mem.previous_relatos) {
      lines.push(`Sessão ${r.session_number}: ${r.input_text.trim()}`);
    }
  }

  return lines.join('\n');
}

export async function POST(req: NextRequest) {
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (!user) return Response.json({ error: authError || 'Não autorizado.' }, { status: 401 });

  try {
    const { messages, patient_id, case_summary } = await req.json() as {
      messages: { role: 'user' | 'assistant'; content: string }[];
      patient_id?: string;
      case_summary?: string;
    };

    if (!messages?.length) {
      return Response.json({ error: 'Mensagens ausentes.' }, { status: 400 });
    }

    /* ── fetch patient context server-side ── */
    let patientBlock: string | undefined;

    if (patient_id) {
      const admin = createAdminClient();
      const [patientRes, memoryRes, sessionsRes] = await Promise.all([
        admin.from('patients').select('*').eq('id', patient_id).single(),
        admin.from('patient_memory').select('*').eq('patient_id', patient_id).single(),
        admin
          .from('sessions')
          .select('id, therapist_notes, session_number, input_text')
          .eq('patient_id', patient_id)
          .order('session_number', { ascending: false }),
      ]);

      const patient = patientRes.data;
      const memory = memoryRes.data;
      const sessions = sessionsRes.data || [];

      if (patient) {
        const weeks = Math.floor((Date.now() - new Date(patient.created_at).getTime()) / (7 * 24 * 60 * 60 * 1000));
        const lastNote = sessions.find(s => s.therapist_notes?.trim())?.therapist_notes;
        const previousRelatos = sessions
          .filter(s => s.input_text?.trim())
          .slice(0, 3)
          .reverse()
          .map(s => ({ session_number: s.session_number as number, input_text: s.input_text as string }));

        const mem: PatientMemoryContext = {
          pseudonym: patient.pseudonym,
          gender: patient.gender || undefined,
          referral_source: patient.referral_source || undefined,
          medication_use: patient.medication_use || undefined,
          intake_sessions_count: patient.sessions_count || undefined,
          weeks_in_therapy: weeks,
          sessions_count: sessions.length,
          confirmed_hypotheses: memory?.confirmed_hypotheses || [],
          discarded_hypotheses: memory?.discarded_hypotheses || [],
          what_worked: memory?.what_worked || [],
          what_didnt_work: memory?.what_didnt_work || [],
          recurring_patterns: memory?.recurring_patterns || [],
          central_themes: memory?.central_themes || [],
          attention_history: (memory?.attention_history || []) as PatientMemoryContext['attention_history'],
          last_session_notes: lastNote || undefined,
          previous_relatos: previousRelatos.length > 0 ? previousRelatos : undefined,
        };

        patientBlock = buildPatientBlock(mem);
      }
    }

    /* ── build system prompt ── */
    const contextParts = [
      patientBlock,
      case_summary ? `CASO IMPORTADO:\n${case_summary}` : undefined,
    ].filter(Boolean);

    const systemPrompt = [
      'Você é um supervisor clínico sênior com 20 anos de experiência em psicoterapia.',
      'Seu papel é conversar com o terapeuta sobre casos clínicos de forma reflexiva, direta e sem julgamentos.',
      '',
      'COMO CONDUZIR:',
      '- Responda de forma concisa e objetiva — sem listas desnecessárias',
      '- Faça perguntas abertas que ajudem o terapeuta a aprofundar sua compreensão do caso',
      '- Quando houver histórico do paciente, use-o ativamente: compare sessões, destaque padrões, revise hipóteses',
      '- Nunca invente informações que não foram fornecidas',
      '- Nunca repita o que o terapeuta já disse — acrescente sempre algo novo',
      '- Responda SEMPRE em português do Brasil',
      contextParts.length > 0 ? `\n${contextParts.join('\n\n')}` : '',
    ].filter(s => s !== '').join('\n');

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.65,
      max_tokens: 500,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-14),
      ],
    });

    return Response.json({ reply: completion.choices[0]?.message?.content || '' });
  } catch (err) {
    console.error('[chat] error:', err);
    return Response.json({ error: 'Erro ao processar mensagem.' }, { status: 500 });
  }
}
