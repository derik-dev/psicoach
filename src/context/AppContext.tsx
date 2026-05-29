'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

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
  setUser: (user: UserProfile | null) => void;
  cases: ClinicalCase[];
  setCases: React.Dispatch<React.SetStateAction<ClinicalCase[]>>;
  activePlan: 'starter' | 'pro' | 'clinica' | 'free';
  setActivePlan: (plan: 'starter' | 'pro' | 'clinica' | 'free') => void;
  analysesUsed: number;
  setAnalysesUsed: (used: number) => void;
  analysesLimit: number | null;
  addCase: (title: string, input_text: string, approach: string, context: CaseContext, analysis: CaseAnalysis) => ClinicalCase;
  updateCase: (id: string, updates: Partial<ClinicalCase>) => void;
  deleteCase: (id: string) => void;
  addChatMessage: (caseId: string, role: 'user' | 'assistant', content: string) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Pre-seeded mock cases
const MOCK_CASES: ClinicalCase[] = [
  {
    id: 'case-1',
    title: 'Paciente Gabriel - Ansiedade Social e Perfeccionismo',
    input_text: 'Paciente de 24 anos, estudante de engenharia, relata alto sofrimento em situações de exposição social na faculdade. Apresenta comportamento de esquiva ativa (deixa de ir a aulas quando há seminários) e pensamentos automáticos do tipo: "Se eu gaguejar, todos vão achar que sou incompetente" e "Eu preciso ser perfeito no que falo". Na infância, relata cobrança excessiva dos pais por desempenho acadêmico exemplar.',
    approach_used: 'TCC (Terapia Cognitivo-Comportamental)',
    context: {
      sessions_count: '5-10',
      current_diagnosis: 'F40.1 (Fobia Social)',
      already_tried: 'Psicoeducação sobre ansiedade e registro de pensamentos disfuncionais.',
      specific_question: 'Como avançar na reestruturação cognitiva de crenças centrais de desvalia?'
    },
    analysis: {
      hypothesis: 'O paciente apresenta um quadro compatível com Fobia Social estruturado sobre uma base de esquemas de padrões inflexíveis e desvalia. O perfeccionismo atua como uma estratégia compensatória para evitar a confirmação de uma crença de inadequação ("sou incompetente"). A esquiva ativa reforça a crença de incapacidade e impede a habituação da ansiedade.',
      approaches: [
        'Reestruturação Cognitiva focada na flexibilização do pensamento dicotômico (tudo ou nada) sobre desempenho.',
        'Experimentos Comportamentais graduais de exposição (ex: fazer uma pergunta simples na aula, gaguejar intencionalmente em ambiente controlado para testar a catastrofização).',
        'Questionamento Socrático direcionado à origem das regras e suposições condicionais do paciente ("Se eu não for perfeito, então...").'
      ],
      questions: [
        'O que gaguejar ou falhar significaria sobre você, lá no fundo?',
        'Quem em sua vida dizia que você precisava ser perfeito para ter valor?',
        'Como seria a sua vida acadêmica se você se permitisse ser um estudante na média por uma semana?',
        'Qual o pior cenário que poderia acontecer se você cometesse um erro em um seminário, e como você lidaria com isso?'
      ],
      references: [
        'Beck, J. S. (2021). Terapia Cognitivo-Comportamental: Teoria e Prática (3ª ed.). Porto Alegre: Artmed.',
        'Clark, D. M., & Wells, A. (1995). A cognitive model of social phobia. In Social phobia: Diagnosis, assessment, and treatment.'
      ],
      blind_spot: 'O terapeuta pode cair na armadilha de tentar debater logicamente com o paciente sobre seu desempenho na faculdade (que costuma ser excelente), em vez de focar na carga afetiva da crença de inadequação. O problema não é a competência do paciente, mas a sua autoavaliação punitiva.',
      alerts: [
        'Monitorar níveis elevados de ansiedade antes das exposições para evitar ataques de pânico secundários.',
        'Ficar atento a comportamentos de segurança sutis durante as exposições (ex: decorar o texto inteiro para não errar).'
      ]
    },
    notes: 'Gabriel respondeu muito bem à psicoeducação. O principal desafio atual é que ele racionaliza muito o processo e tem dificuldade de entrar em contato com a vulnerabilidade emocional durante as sessões.',
    tags: ['ansiedade', 'perfeccionismo', 'esquiva', 'tcc'],
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Como posso trabalhar os comportamentos de segurança sutil que ele usa na exposição?',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 1000 * 60).toISOString()
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Para abordar os comportamentos de segurança sutil (como decorar falas, falar rápido ou evitar contato visual durante a exposição), recomendo as seguintes intervenções:\n\n1. **Identificação e Mapeamento:** Em sessão, peça para ele fazer uma lista de tudo o que ele faz "para garantir que nada dê errado" (ex: "segurar o papel com força para não tremer").\n2. **Experimentos Comportamentais Contrastantes:** Faça uma exposição na própria sessão onde primeiro ele usa todos os comportamentos de segurança e depois repete a exposição abandonando-os deliberadamente (ex: falar segurando as mãos soltas). Pergunte a diferença na ansiedade focada e no foco de atenção (geralmente, sem comportamentos de segurança ele consegue focar mais no ambiente externo e menos em si mesmo).\n3. **Psicoeducação sobre o Efeito Reverso:** Explique que esses comportamentos funcionam como "rodinhas de bicicleta" que mantêm a crença de perigo ativa: "Eu só sobrevivi porque decorei tudo". Abandoná-los é o que gera a verdadeira aprendizagem de segurança.',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 1000 * 60 * 5).toISOString()
      }
    ]
  },
  {
    id: 'case-2',
    title: 'Paciente Marina - Luto Complicado e Sentimento de Culpa',
    input_text: 'Paciente de 42 anos, casada, perdeu a mãe há 10 meses de forma súbita (infarto). Relata tristeza persistente, perda de interesse em suas atividades de lazer (jardinagem, leitura) e um sentimento paralisante de culpa. Ela repete constantemente: "Eu deveria ter insistido para ela ir ao médico naquela semana" e "Eu fui egoísta por focar no meu trabalho". Evita entrar na antiga casa da mãe e tem crises de choro diárias ao ver fotos.',
    approach_used: 'Psicanálise',
    context: {
      sessions_count: '20-50',
      current_diagnosis: 'Luto Prolongado (CID-11: 6B42)',
      already_tried: 'Associação livre sobre a relação materna e elaboração da perda física.',
      specific_question: 'Como abordar o caráter punitivo do superego manifestado como culpa?'
    },
    analysis: {
      hypothesis: 'A paciente apresenta um processo de luto suspenso/complicado, caracterizado por uma forte identificação melancólica com o objeto perdido. A culpa autoimposta funciona como uma tentativa psíquica de manter o objeto "vivo" e evitar o vazio desorganizador da perda. O superego severo pune o ego com autoacusações ("fui egoísta") que expressam, na verdade, a ambivalência da relação com a mãe (prováveis sentimentos reprimidos de hostilidade ou desejo de independência).',
      approaches: [
        'Trabalho de Elaboração da Ambivalência: Permitir que a paciente expresse os sentimentos hostis ou de raiva em relação à mãe, sem o peso da punição moral.',
        'Investigação do Lugar Ocupado pela Mãe na Economia Psíquica da paciente (idealização vs realidade).',
        'Simbolização do Vazio: Ajudar o ego a se desinvestir da libido outrora direcionada à mãe, permitindo novos investimentos (substitutos libidinais).'
      ],
      questions: [
        'O que significa para você deixar de se sentir culpada pela morte de sua mãe?',
        'Quais eram as coisas que a irritavam ou incomodavam na sua relação com ela?',
        'Parece haver uma regra de que você só pode mostrar amor sofrendo. De onde vem essa ideia?',
        'Quem você estaria traindo se voltasse a sentir alegria nas suas atividades?'
      ],
      references: [
        'Freud, S. (1917). Luto e Melancolia. In Edição Standard Brasileira das Obras Psicológicas Completas.',
        'Nasio, J.-D. (2011). A dor de amar. Rio de Janeiro: Zahar.'
      ],
      blind_spot: 'O terapeuta pode assumir uma postura puramente confortadora ("você não teve culpa"), o que tende a intensificar a resistência. A culpa tem uma função psíquica ativa para ela e precisa ser compreendida na sua raiz inconsciente, não apenas desmentida racionalmente.',
      alerts: [
        'Avaliar riscos de depressão maior severa com ideação de autodepreciação profunda.',
        'Observar sintomas somáticos associados ao luto (ex: dores crônicas, distúrbios do sono intensos).'
      ]
    },
    notes: 'Marina tem apresentado insights ricos sobre a cobrança de perfeição que a própria mãe exercia sobre ela, o que agora ela projeta na sua autossabotagem e na culpa.',
    tags: ['luto', 'culpa', 'melancolia', 'psicanalise'],
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    messages: []
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [cases, setCases] = useState<ClinicalCase[]>([]);
  const [activePlan, setActivePlan] = useState<'starter' | 'pro' | 'clinica' | 'free'>('starter');
  const [analysesUsed, setAnalysesUsed] = useState<number>(2);
  const [initialized, setInitialized] = useState(false);

  const analysesLimit = activePlan === 'starter' ? 10 : activePlan === 'free' ? 2 : null;

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('psicoach_user');
      const storedCases = localStorage.getItem('psicoach_cases');
      const storedPlan = localStorage.getItem('psicoach_plan');
      const storedUsed = localStorage.getItem('psicoach_used');

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        // Start in mock state but onboarding not completed
        setUser(null);
      }

      if (storedCases) {
        setCases(JSON.parse(storedCases));
      } else {
        setCases(MOCK_CASES);
        localStorage.setItem('psicoach_cases', JSON.stringify(MOCK_CASES));
      }

      if (storedPlan) {
        setActivePlan(storedPlan as any);
      }

      if (storedUsed) {
        setAnalysesUsed(parseInt(storedUsed, 10));
      }

      setInitialized(true);
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    if (initialized) {
      if (user) {
        localStorage.setItem('psicoach_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('psicoach_user');
      }
    }
  }, [user, initialized]);

  useEffect(() => {
    if (initialized) {
      localStorage.setItem('psicoach_cases', JSON.stringify(cases));
    }
  }, [cases, initialized]);

  useEffect(() => {
    if (initialized) {
      localStorage.setItem('psicoach_plan', activePlan);
    }
  }, [activePlan, initialized]);

  useEffect(() => {
    if (initialized) {
      localStorage.setItem('psicoach_used', analysesUsed.toString());
    }
  }, [analysesUsed, initialized]);

  const addCase = (
    title: string,
    input_text: string,
    approach: string,
    context: CaseContext,
    analysis: CaseAnalysis
  ) => {
    const newCase: ClinicalCase = {
      id: `case-${Date.now()}`,
      title: title || `Caso ${new Date().toLocaleDateString('pt-BR')}`,
      input_text,
      approach_used: approach,
      context,
      analysis,
      notes: '',
      tags: [approach.toLowerCase().replace(/[^a-z]/g, '')],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages: []
    };

    setCases((prev) => [newCase, ...prev]);
    setAnalysesUsed((prev) => prev + 1);
    return newCase;
  };

  const updateCase = (id: string, updates: Partial<ClinicalCase>) => {
    setCases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c))
    );
  };

  const deleteCase = (id: string) => {
    setCases((prev) => prev.filter((c) => c.id !== id));
  };

  const addChatMessage = (caseId: string, role: 'user' | 'assistant', content: string) => {
    setCases((prev) =>
      prev.map((c) => {
        if (c.id === caseId) {
          const newMsg: CaseMessage = {
            id: `msg-${Date.now()}`,
            role,
            content,
            created_at: new Date().toISOString()
          };
          return {
            ...c,
            messages: [...c.messages, newMsg],
            updated_at: new Date().toISOString()
          };
        }
        return c;
      })
    );
  };

  const logout = () => {
    setUser(null);
    setCases(MOCK_CASES);
    setActivePlan('starter');
    setAnalysesUsed(2);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('psicoach_user');
      localStorage.removeItem('psicoach_plan');
      localStorage.removeItem('psicoach_used');
      localStorage.setItem('psicoach_cases', JSON.stringify(MOCK_CASES));
    }
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
        logout
      }}
    >
      {initialized ? children : <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Carregando PsiCoach AI...</div>}
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
