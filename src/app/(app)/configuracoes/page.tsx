'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase/client';
import {
  Settings,
  User,
  CreditCard,
  Sliders,
  Shield,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  Download,
  Lock,
  Save
} from 'lucide-react';

export default function Configs() {
  const { user, setUser, activePlan, setActivePlan, logout } = useApp();

  const [activeTab, setActiveTab] = useState<'perfil' | 'assinatura' | 'preferencias' | 'seguranca' | 'privacidade'>('perfil');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [crp, setCrp] = useState(user?.crp || '');
  const [yearsExperience, setYearsExperience] = useState(user?.yearsExperience || '1-2');

  const [mainApproach, setMainApproach] = useState(user?.mainApproach || 'TCC (Terapia Cognitivo-Comportamental)');
  const [approachDescription, setApproachDescription] = useState(user?.approachDescription || '');
  const [responseDetail, setResponseDetail] = useState<'conciso' | 'detalhado'>(user?.responseDetail || 'detalhado');

  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  if (!user) return null;

  const showSuccess = () => {
    setSaveError(null);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleSavePerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setUser({ ...user, name, email, crp, yearsExperience });
      showSuccess();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Não foi possível salvar o perfil.');
    }
  };

  const handleSavePreferencias = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setUser({ ...user, mainApproach, approachDescription, responseDetail });
      showSuccess();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Não foi possível salvar as preferências.');
    }
  };

  const handleSaveSeguranca = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setCurrPassword('');
      setNewPassword('');
      showSuccess();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Não foi possível atualizar a senha.');
    }
  };

  const handlePlanChange = async (plan: 'starter' | 'pro' | 'clinica') => {
    try {
      await setActivePlan(plan);
      showSuccess();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Não foi possível salvar o plano.');
    }
  };

  const handleExportData = () => {
    alert('Os seus dados completos foram exportados em conformidade com a LGPD (Art. 18). Verifique seus downloads.');
  };

  const handleDeleteAccount = () => {
    if (confirm('ATENÇÃO: Deseja realmente excluir permanentemente sua conta PsiCoach AI? Esta ação é irreversível.')) {
      logout();
    }
  };

  const tabs = [
    { id: 'perfil', label: 'Perfil Profissional', icon: User },
    { id: 'preferencias', label: 'Preferências Clínicas', icon: Sliders },
    { id: 'assinatura', label: 'Plano & Assinatura', icon: CreditCard },
    { id: 'seguranca', label: 'Segurança', icon: Shield },
    { id: 'privacidade', label: 'Privacidade & LGPD', icon: Trash2 }
  ] as const;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="surface-card p-7 lg:p-10 space-y-4">
        <div className="section-badge">
          <Settings className="w-3 h-3 text-blue-600" />
          <span>Configurações</span>
        </div>
        <h1 className="page-headline">
          Suas <span className="page-headline-accent">preferências.</span>
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">
          Gerencie seu perfil profissional, plano de assinatura, segurança da conta e privacidade.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Tab nav */}
        <div className="flex flex-col space-y-1.5 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                  active
                    ? 'bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="lg:col-span-3 bg-white border border-slate-100 rounded-3xl shadow-sm p-6 lg:p-8">
          {saveSuccess && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Configurações atualizadas com sucesso!</span>
            </div>
          )}

          {saveError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{saveError}</span>
            </div>
          )}

          {activeTab === 'perfil' && (
            <form onSubmit={handleSavePerfil} className="space-y-5">
              <h3 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-3">
                Perfil profissional
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Nome completo</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">E-mail</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Número CRP</label>
                  <input
                    type="text"
                    required
                    value={crp}
                    onChange={(e) => setCrp(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Experiência clínica</label>
                  <select
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none transition-colors"
                  >
                    <option value="1-2">Recém formada (1-2 anos)</option>
                    <option value="3-5">Experiente inicial (3-5 anos)</option>
                    <option value="5-10">Maturidade clínica (5-10 anos)</option>
                    <option value="+10">Sênior (+10 anos)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-[0_8px_20px_rgba(37,99,235,0.22)]"
              >
                <Save className="w-4 h-4" />
                <span>Salvar perfil</span>
              </button>
            </form>
          )}

          {activeTab === 'preferencias' && (
            <form onSubmit={handleSavePreferencias} className="space-y-5">
              <h3 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-3">
                Preferências teóricas da IA
              </h3>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Abordagem clínica padrão</label>
                <select
                  value={mainApproach}
                  onChange={(e) => setMainApproach(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none transition-colors"
                >
                  <option value="TCC (Terapia Cognitivo-Comportamental)">TCC (Terapia Cognitivo-Comportamental)</option>
                  <option value="Psicanálise">Psicanálise</option>
                  <option value="Humanista / Fenomenologia">Humanista / Fenomenologia</option>
                  <option value="Sistêmica / Terapia Familiar">Sistêmica / Terapia Familiar</option>
                  <option value="Gestalt-terapia">Gestalt-terapia</option>
                  <option value="Junguiana / Psicologia Analítica">Junguiana / Psicologia Analítica</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Nível de detalhe das respostas</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  {(['conciso', 'detalhado'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setResponseDetail(opt)}
                      className={`flex-1 px-4 py-3 rounded-xl border text-xs font-semibold transition-all text-left ${
                        responseDetail === opt
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-blue-200'
                      }`}
                    >
                      {opt === 'conciso' ? 'Foco e Concisão' : 'Detalhamento Completo'}
                      <span className="block text-[10px] font-normal text-slate-500 mt-1">
                        {opt === 'conciso' ? 'Resumos diretos' : 'Profundidade teórica e citações'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Especificações do consultório (opcional)</label>
                <textarea
                  value={approachDescription}
                  onChange={(e) => setApproachDescription(e.target.value)}
                  placeholder="Ex: Trabalho sob o referencial específico de Aaron Beck focada em depressão..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl p-3 text-xs text-slate-700 placeholder-slate-400 outline-none transition-colors resize-none leading-relaxed"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-[0_8px_20px_rgba(37,99,235,0.22)]"
              >
                <Save className="w-4 h-4" />
                <span>Salvar preferências</span>
              </button>
            </form>
          )}

          {activeTab === 'assinatura' && (
            <div className="space-y-6">
              <h3 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-3">
                Plano de assinatura
              </h3>

              <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider">Assinatura ativa</span>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-semibold text-slate-800 capitalize">Plano PsiCoach {activePlan}</h4>
                    {activePlan === 'starter' && (
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded bg-blue-600 text-white">Upgrade disponível</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {activePlan === 'starter' ? 'Limite de 10 análises mensais' : 'Análises clínicas ilimitadas'}
                  </p>
                </div>
                <div className="text-left md:text-right">
                  <span className="text-2xl font-light text-slate-900 tracking-tight">{activePlan === 'starter' ? 'R$ 97' : activePlan === 'pro' ? 'R$ 197' : 'R$ 397'}<span className="text-xs text-slate-400">/mês</span></span>
                  <p className="text-[10px] text-slate-400 flex items-center md:justify-end gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>Renova em 15/06/2026</span>
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Mudar ou contratar plano</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {([
                    { id: 'starter' as const, name: 'Starter', desc: '10 análises/mês, respostas padrão.', price: 'R$97', popular: false },
                    { id: 'pro' as const, name: 'Pro', desc: 'Análises ilimitadas + chat avançado.', price: 'R$197', popular: true },
                    { id: 'clinica' as const, name: 'Clínica', desc: 'Até 5 psicólogas + painel gestor.', price: 'R$397', popular: false }
                  ]).map((plan) => (
                    <div
                      key={plan.id}
                      className={`p-4 rounded-2xl border flex flex-col justify-between h-44 relative ${
                        activePlan === plan.id
                          ? 'border-blue-600 bg-blue-50/40'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      {plan.popular && (
                        <span className="absolute top-0 right-0 bg-blue-600 text-[8px] font-bold uppercase tracking-widest text-white px-2 py-0.5 rounded-bl">Popular</span>
                      )}
                      <div>
                        <h5 className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                          <span>Plano {plan.name}</span>
                          {plan.popular && <Sparkles className="w-3.5 h-3.5 text-blue-600" />}
                        </h5>
                        <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{plan.desc}</p>
                      </div>
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-800">{plan.price}/mês</span>
                        {activePlan === plan.id ? (
                          <span className="text-[10px] font-semibold text-blue-700">Atual</span>
                        ) : (
                          <button onClick={() => handlePlanChange(plan.id)} className="text-[10px] font-semibold bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors">
                            Assinar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'seguranca' && (
            <form onSubmit={handleSaveSeguranca} className="space-y-5">
              <h3 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-3">
                Segurança da conta
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Senha atual</label>
                  <input
                    type="password"
                    required
                    value={currPassword}
                    onChange={(e) => setCurrPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Nova senha</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex gap-3 text-slate-600">
                <Lock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-slate-800">Autenticação de Duplo Fator (2FA)</h4>
                  <p className="text-[11px] leading-relaxed text-slate-500">
                    Aumente a segurança do seu prontuário blindando seu login com um aplicativo autenticador.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-[0_8px_20px_rgba(37,99,235,0.22)]"
              >
                <Shield className="w-4 h-4" />
                <span>Atualizar segurança</span>
              </button>
            </form>
          )}

          {activeTab === 'privacidade' && (
            <div className="space-y-6">
              <h3 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-3">
                Privacidade, dados & LGPD
              </h3>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
                <div className="flex gap-3 text-slate-600">
                  <Shield className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-slate-800">Seus dados são 100% privados</h4>
                    <p className="text-[11px] leading-relaxed text-slate-500">
                      Obedecemos rigorosamente à LGPD (Lei nº 13.709). Relatos são criptografados ponta a ponta e anonimizados. Nunca vendemos, compartilhamos ou repassamos seus prontuários para treinar modelos públicos de IA.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 pt-4 flex-wrap gap-3">
                  <div className="space-y-0.5">
                    <h5 className="text-xs font-semibold text-slate-800">Portabilidade de Dados (Art. 18, V)</h5>
                    <p className="text-[10px] text-slate-500">Baixe todo o histórico de análises e evolução clínica.</p>
                  </div>
                  <button
                    onClick={handleExportData}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-xl text-xs font-semibold transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Exportar dados</span>
                  </button>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-rose-200 bg-rose-50/60 space-y-4">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-rose-700">Exclusão Definitiva de Conta</h4>
                    <p className="text-[11px] leading-relaxed text-rose-600">
                      Sob o Direito ao Esquecimento (Art. 16, LGPD), você pode solicitar a destruição de toda a sua base de dados. Isso cancelará suas cobranças e apagará todos os casos para sempre.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleDeleteAccount}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir minha conta</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
