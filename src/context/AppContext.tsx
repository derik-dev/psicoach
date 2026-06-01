'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface CaseContext {
  sessions_count?: string;
  current_diagnosis?: string;
  already_tried?: string;
  specific_question?: string;
}

export interface CaseAnalysis {
  hypothesis: string;
  approaches: string[];
  questions: string[];
  references: string[];
  blind_spot: string;
  alerts: string[];
  // Extended fields returned by the new API response format (optional)
  resumo_rapido?: string;
  nivel_atencao?: 'baixo' | 'moderado' | 'alto';
  foco_inicial?: string;
  proxima_pergunta?: string;
  hipotese_central?: string;
  fatores_relevantes?: string[];
  plano_imediato?: string[];
  perguntas_clinicas?: string[];
  tags?: string[];
  sintese?: string;
  formulacao?: string;
  risco_e_protecao?: string;
  intervencoes?: string;
  prontuario?: string;
  referencias_texto?: string;
}

export interface CaseMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ClinicalCase {
  id: string;
  title: string;
  input_text: string;
  approach_used: string;
  context: CaseContext;
  analysis: CaseAnalysis;
  notes: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  messages: CaseMessage[];
}

export interface UserProfile {
  name: string;
  email: string;
  crp: string;
  onboardingCompleted: boolean;
  yearsExperience: string;
  patientTypes: string[];
  specialties: string[];
  mainApproach: string;
  approachDescription: string;
  responseDetail: 'conciso' | 'detalhado';
}

interface AppContextType {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => Promise<void>;
  cases: ClinicalCase[];
  setCases: React.Dispatch<React.SetStateAction<ClinicalCase[]>>;
  activePlan: 'starter' | 'pro' | 'clinica' | 'free';
  setActivePlan: (plan: 'starter' | 'pro' | 'clinica' | 'free') => Promise<void>;
  analysesUsed: number;
  setAnalysesUsed: React.Dispatch<React.SetStateAction<number>>;
  analysesLimit: number | null;
  addCase: (
    title: string,
    input_text: string,
    approach: string,
    context: CaseContext,
    analysis: CaseAnalysis,
    options?: { incrementUsage?: boolean }
  ) => Promise<ClinicalCase>;
  updateCase: (id: string, updates: Partial<ClinicalCase>) => Promise<void>;
  deleteCase: (id: string) => Promise<void>;
  addChatMessage: (caseId: string, role: 'user' | 'assistant', content: string) => Promise<void>;
  logout: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
<<<<<<< HEAD
=======
  signInWithGoogle: () => Promise<{ error: string | null }>;
>>>>>>> e70404a (chore: initial commit — projeto PsiCoach AI)
  signUp: (name: string, email: string, crp: string, password: string) => Promise<{ error: string | null; needsEmailConfirmation?: boolean }>;
  initialized: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, _setUser] = useState<UserProfile | null>(null);
  const [cases, setCases] = useState<ClinicalCase[]>([]);
  const [activePlan, _setActivePlan] = useState<'starter' | 'pro' | 'clinica' | 'free'>('starter');
  const [analysesUsed, setAnalysesUsed] = useState<number>(0);
  const [analysesLimit, setAnalysesLimit] = useState<number | null>(10);
  const [initialized, setInitialized] = useState(false);

  const userIdRef = useRef<string | null>(null);
  const analysesUsedRef = useRef<number>(0);

  useEffect(() => {
    analysesUsedRef.current = analysesUsed;
  }, [analysesUsed]);

  const loadUserData = async (userId: string, userEmail: string) => {
    const [{ data: profile }, { data: sub }, { data: casesData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', userId).single(),
      supabase.from('subscriptions').select('*').eq('user_id', userId).single(),
      supabase
        .from('cases')
        .select('*, messages(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
    ]);

    if (profile) {
      _setUser({
        name: profile.full_name || '',
        email: userEmail,
        crp: profile.crp || '',
        onboardingCompleted: profile.onboarding_completed || false,
        yearsExperience: profile.years_experience || '',
        patientTypes: profile.patient_types || [],
        specialties: profile.specialties || [],
        mainApproach: profile.main_approach || '',
        approachDescription: profile.approach_description || '',
        responseDetail: (profile.response_detail as 'conciso' | 'detalhado') || 'detalhado',
      });
    }

    if (sub) {
      _setActivePlan(sub.plan as 'starter' | 'pro' | 'clinica' | 'free');
      setAnalysesUsed(sub.analyses_used || 0);
      setAnalysesLimit(sub.analyses_limit ?? 10);
    }

    if (casesData) {
      setCases(
        casesData.map((c) => ({
          id: c.id,
          title: c.title || '',
          input_text: c.input_text,
          approach_used: c.approach_used || '',
          context: (c.context as CaseContext) || {},
          analysis: (c.analysis as CaseAnalysis) || { hypothesis: '', approaches: [], questions: [], references: [], blind_spot: '', alerts: [] },
          notes: c.notes || '',
          tags: c.tags || [],
          created_at: c.created_at,
          updated_at: c.updated_at,
          messages: ((c.messages as CaseMessage[]) || [])
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
        }))
      );
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        userIdRef.current = session.user.id;
        loadUserData(session.user.id, session.user.email || '').finally(() => setInitialized(true));
      } else {
        setInitialized(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        userIdRef.current = session.user.id;
        if (event === 'SIGNED_IN') {
          loadUserData(session.user.id, session.user.email || '');
        }
      } else {
        userIdRef.current = null;
        _setUser(null);
        setCases([]);
        _setActivePlan('starter');
        setAnalysesUsed(0);
        setAnalysesLimit(10);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setUser = async (userOrNull: UserProfile | null) => {
    if (!userOrNull) {
      _setUser(null);
      return;
    }

    if (!userIdRef.current) {
      throw new Error('Usuário não autenticado. Não foi possível salvar perfil no Supabase.');
    }

    if (userOrNull.email && userOrNull.email !== user?.email) {
      const { error: authError } = await supabase.auth.updateUser({
        email: userOrNull.email,
        data: {
          full_name: userOrNull.name,
          crp: userOrNull.crp,
        },
      });

      if (authError) {
        throw new Error(`Falha ao atualizar usuário no Supabase Auth: ${authError.message}`);
      }
    } else {
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          full_name: userOrNull.name,
          crp: userOrNull.crp,
        },
      });

      if (metadataError) {
        throw new Error(`Falha ao atualizar metadados no Supabase Auth: ${metadataError.message}`);
      }
    }

    const { error } = await supabase.from('profiles').upsert(
      {
        user_id: userIdRef.current,
        full_name: userOrNull.name,
        crp: userOrNull.crp,
        years_experience: userOrNull.yearsExperience,
        patient_types: userOrNull.patientTypes,
        specialties: userOrNull.specialties,
        main_approach: userOrNull.mainApproach,
        approach_description: userOrNull.approachDescription,
        response_detail: userOrNull.responseDetail,
        onboarding_completed: userOrNull.onboardingCompleted,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    if (error) {
      throw new Error(`Falha ao salvar perfil no Supabase: ${error.message}`);
    }

    _setUser(userOrNull);
  };

  const setActivePlan = async (plan: 'starter' | 'pro' | 'clinica' | 'free'): Promise<void> => {
    if (!userIdRef.current) {
      throw new Error('Usuário não autenticado. Não foi possível salvar o plano no Supabase.');
    }

    const planLimits: Record<typeof plan, number | null> = {
      free: 0,
      starter: 10,
      pro: null,
      clinica: null,
    };

    const { error } = await supabase
      .from('subscriptions')
      .upsert(
        {
          user_id: userIdRef.current,
          plan,
          status: plan === 'free' ? 'inactive' : 'active',
          analyses_limit: planLimits[plan],
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      throw new Error(`Falha ao salvar assinatura no Supabase: ${error.message}`);
    }

    _setActivePlan(plan);
    setAnalysesLimit(planLimits[plan]);
  };

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

<<<<<<< HEAD
=======
  const signInWithGoogle = async (): Promise<{ error: string | null }> => {
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) return { error: error.message };
    return { error: null };
  };

>>>>>>> e70404a (chore: initial commit — projeto PsiCoach AI)
  const signUp = async (
    name: string,
    email: string,
    crp: string,
    password: string
  ): Promise<{ error: string | null; needsEmailConfirmation?: boolean }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, crp } },
    });
    if (error) return { error: error.message };
    if (!data.user) return { error: 'Erro inesperado ao criar conta.' };
    // Profile and subscription are created automatically by the DB trigger

    if (!data.session) {
      return { error: null, needsEmailConfirmation: true };
    }

    userIdRef.current = data.user.id;
    _setUser({
      name,
      email,
      crp,
      onboardingCompleted: false,
      yearsExperience: '',
      patientTypes: [],
      specialties: [],
      mainApproach: '',
      approachDescription: '',
      responseDetail: 'detalhado',
    });
    _setActivePlan('starter');
    setAnalysesUsed(0);
    setAnalysesLimit(10);
    setCases([]);

    return { error: null, needsEmailConfirmation: false };
  };

  const addCase = async (
    title: string,
    input_text: string,
    approach: string,
    context: CaseContext,
    analysis: CaseAnalysis,
    options: { incrementUsage?: boolean } = {}
  ): Promise<ClinicalCase> => {
    if (!userIdRef.current) {
      throw new Error('Usuário não autenticado. Não foi possível salvar no Supabase.');
    }

    const incrementUsage = options.incrementUsage ?? true;
    const newCase: ClinicalCase = {
      id: crypto.randomUUID(),
      title: title || `Caso ${new Date().toLocaleDateString('pt-BR')}`,
      input_text,
      approach_used: approach,
      context,
      analysis,
      notes: '',
      tags: [approach.toLowerCase().replace(/[^a-z]/g, '')],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages: [],
    };

    const { error: caseError } = await supabase.from('cases').insert({
      id: newCase.id,
      user_id: userIdRef.current,
      title: newCase.title,
      input_text: newCase.input_text,
      approach_used: newCase.approach_used,
      context: newCase.context,
      analysis: newCase.analysis,
      notes: newCase.notes,
      tags: newCase.tags,
    });

    if (caseError) {
      throw new Error(`Falha ao salvar caso no Supabase: ${caseError.message}`);
    }

    if (incrementUsage) {
      const newUsed = analysesUsedRef.current + 1;
      const { error: subError } = await supabase
        .from('subscriptions')
        .update({ analyses_used: newUsed })
        .eq('user_id', userIdRef.current);

      if (subError) {
        throw new Error(`Falha ao atualizar uso no Supabase: ${subError.message}`);
      }

      setAnalysesUsed(newUsed);
    }

    setCases((prev) => [newCase, ...prev]);
    return newCase;
  };

  const updateCase = async (id: string, updates: Partial<ClinicalCase>): Promise<void> => {
    if (!userIdRef.current) {
      throw new Error('Usuário não autenticado. Não foi possível atualizar no Supabase.');
    }

    const updatedAt = new Date().toISOString();
    const dbUpdates: Record<string, unknown> = { updated_at: updatedAt };
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.input_text !== undefined) dbUpdates.input_text = updates.input_text;
    if (updates.approach_used !== undefined) dbUpdates.approach_used = updates.approach_used;
    if (updates.context !== undefined) dbUpdates.context = updates.context;
    if (updates.analysis !== undefined) dbUpdates.analysis = updates.analysis;

    const { error } = await supabase.from('cases').update(dbUpdates).eq('id', id);

    if (error) {
      throw new Error(`Falha ao atualizar caso no Supabase: ${error.message}`);
    }

    setCases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, updated_at: updatedAt } : c))
    );
  };

  const deleteCase = async (id: string): Promise<void> => {
    if (!userIdRef.current) {
      throw new Error('Usuário não autenticado. Não foi possível excluir no Supabase.');
    }

    const { error } = await supabase.from('cases').delete().eq('id', id);

    if (error) {
      throw new Error(`Falha ao excluir caso no Supabase: ${error.message}`);
    }

    setCases((prev) => prev.filter((c) => c.id !== id));
  };

  const addChatMessage = async (
    caseId: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<void> => {
    if (!userIdRef.current) {
      throw new Error('Usuário não autenticado. Não foi possível salvar mensagem no Supabase.');
    }

    const newMsg: CaseMessage = {
      id: crypto.randomUUID(),
      role,
      content,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('messages').insert({
      id: newMsg.id,
      case_id: caseId,
      user_id: userIdRef.current,
      role,
      content,
    });

    if (error) {
      throw new Error(`Falha ao salvar mensagem no Supabase: ${error.message}`);
    }

    setCases((prev) =>
      prev.map((c) => {
        if (c.id === caseId) {
          return {
            ...c,
            messages: [...c.messages, newMsg],
            updated_at: new Date().toISOString(),
          };
        }
        return c;
      })
    );
  };

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
    _setUser(null);
    setCases([]);
    _setActivePlan('starter');
    setAnalysesUsed(0);
    setAnalysesLimit(10);
    userIdRef.current = null;
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        cases,
        setCases,
        activePlan,
        setActivePlan,
        analysesUsed,
        setAnalysesUsed,
        analysesLimit,
        addCase,
        updateCase,
        deleteCase,
        addChatMessage,
        logout,
        signIn,
<<<<<<< HEAD
=======
        signInWithGoogle,
>>>>>>> e70404a (chore: initial commit — projeto PsiCoach AI)
        signUp,
        initialized,
      }}
    >
      {initialized ? (
        children
      ) : (
<<<<<<< HEAD
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
          Carregando PsiCoach AI...
=======
        <div
          className="min-h-screen flex flex-col items-center justify-center gap-6"
          style={{ background: 'var(--bg-dark-obsidian)' }}
        >
          <div className="flex flex-col items-center gap-3">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="22" stroke="rgba(177,140,242,0.25)" strokeWidth="2" />
              <circle cx="24" cy="24" r="14" fill="rgba(177,140,242,0.08)" />
              <path
                d="M24 14c-5.523 0-10 4.477-10 10s4.477 10 10 10 10-4.477 10-10"
                stroke="#b18cf2"
                strokeWidth="2.5"
                strokeLinecap="round"
                style={{ transformOrigin: '24px 24px', animation: 'spin 1s linear infinite' }}
              />
              <circle cx="24" cy="24" r="3" fill="#b18cf2" opacity="0.7" />
            </svg>
            <p
              className="text-sm tracking-widest uppercase"
              style={{ color: 'var(--text-mauve)', fontFamily: 'var(--font-sans)', letterSpacing: '0.2em' }}
            >
              PsiCoach AI
            </p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
>>>>>>> e70404a (chore: initial commit — projeto PsiCoach AI)
        </div>
      )}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
