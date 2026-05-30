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
  setActivePlan: (plan: 'starter' | 'pro' | 'clinica' | 'free') => void;
  analysesUsed: number;
  setAnalysesUsed: React.Dispatch<React.SetStateAction<number>>;
  analysesLimit: number | null;
  addCase: (title: string, input_text: string, approach: string, context: CaseContext, analysis: CaseAnalysis) => Promise<ClinicalCase>;
  updateCase: (id: string, updates: Partial<ClinicalCase>) => Promise<void>;
  deleteCase: (id: string) => Promise<void>;
  addChatMessage: (caseId: string, role: 'user' | 'assistant', content: string) => Promise<void>;
  logout: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (name: string, email: string, crp: string, password: string) => Promise<{ error: string | null; needsEmailConfirmation?: boolean }>;
  initialized: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, _setUser] = useState<UserProfile | null>(null);
  const [cases, setCases] = useState<ClinicalCase[]>([]);
  const [activePlan, setActivePlan] = useState<'starter' | 'pro' | 'clinica' | 'free'>('starter');
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
      setActivePlan(sub.plan as 'starter' | 'pro' | 'clinica' | 'free');
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
        setActivePlan('starter');
        setAnalysesUsed(0);
        setAnalysesLimit(10);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setUser = async (userOrNull: UserProfile | null) => {
    _setUser(userOrNull);
    if (!userOrNull || !userIdRef.current) return;

    await supabase.from('profiles').upsert(
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
  };

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signUp = async (
    name: string,
    email: string,
    crp: string,
    password: string
  ): Promise<{ error: string | null; needsEmailConfirmation?: boolean }> => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (!data.user) return { error: 'Erro inesperado ao criar conta.' };

    await Promise.all([
      supabase.from('profiles').insert({
        user_id: data.user.id,
        full_name: name,
        crp: crp,
        onboarding_completed: false,
      }),
      supabase.from('subscriptions').insert({
        user_id: data.user.id,
        plan: 'starter',
        analyses_limit: 10,
        analyses_used: 0,
      }),
    ]);

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
    setActivePlan('starter');
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
    analysis: CaseAnalysis
  ): Promise<ClinicalCase> => {
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

    setCases((prev) => [newCase, ...prev]);
    setAnalysesUsed((prev) => prev + 1);

    if (userIdRef.current) {
      const newUsed = analysesUsedRef.current + 1;
      await Promise.all([
        supabase.from('cases').insert({
          id: newCase.id,
          user_id: userIdRef.current,
          title: newCase.title,
          input_text: newCase.input_text,
          approach_used: newCase.approach_used,
          context: newCase.context,
          analysis: newCase.analysis,
          tags: newCase.tags,
        }),
        supabase
          .from('subscriptions')
          .update({ analyses_used: newUsed })
          .eq('user_id', userIdRef.current),
      ]);
    }

    return newCase;
  };

  const updateCase = async (id: string, updates: Partial<ClinicalCase>): Promise<void> => {
    setCases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c))
    );

    if (userIdRef.current) {
      const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.context !== undefined) dbUpdates.context = updates.context;
      if (updates.analysis !== undefined) dbUpdates.analysis = updates.analysis;

      await supabase.from('cases').update(dbUpdates).eq('id', id);
    }
  };

  const deleteCase = async (id: string): Promise<void> => {
    setCases((prev) => prev.filter((c) => c.id !== id));
    if (userIdRef.current) {
      await supabase.from('cases').delete().eq('id', id);
    }
  };

  const addChatMessage = async (
    caseId: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<void> => {
    const newMsg: CaseMessage = {
      id: crypto.randomUUID(),
      role,
      content,
      created_at: new Date().toISOString(),
    };

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

    if (userIdRef.current) {
      await supabase.from('messages').insert({
        id: newMsg.id,
        case_id: caseId,
        user_id: userIdRef.current,
        role,
        content,
      });
    }
  };

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
    _setUser(null);
    setCases([]);
    setActivePlan('starter');
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
        signUp,
        initialized,
      }}
    >
      {initialized ? (
        children
      ) : (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
          Carregando PsiCoach AI...
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
