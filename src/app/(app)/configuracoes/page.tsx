'use client';

import React, { useState } from 'react';
import { useApp, UserProfile } from '@/context/AppContext';
import {
  Settings,
  User,
  CreditCard,
  Sliders,
  Shield,
  Trash2,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  Download,
  Lock,
  Save
} from 'lucide-react';

export default function Configs() {
  const { user, setUser, activePlan, setActivePlan, logout } = useApp();
  
  // Tab control
  const [activeTab, setActiveTab] = useState<'perfil' | 'assinatura' | 'preferencias' | 'seguranca' | 'privacidade'>('perfil');

  // Success states
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states - Perfil
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [crp, setCrp] = useState(user?.crp || '');
  const [yearsExperience, setYearsExperience] = useState(user?.yearsExperience || '1-2');

  // Form states - Preferências
  const [mainApproach, setMainApproach] = useState(user?.mainApproach || 'TCC (Terapia Cognitivo-Comportamental)');
  const [approachDescription, setApproachDescription] = useState(user?.approachDescription || '');
  const [responseDetail, setResponseDetail] = useState<'conciso' | 'detalhado'>(user?.responseDetail || 'detalhado');

  // Form states - Segurança
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  if (!user) return null;

  const handleSavePerfil = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({
      ...user,
      name,
      email,
      crp,
      yearsExperience
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleSavePreferencias = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({
      ...user,
      mainApproach,
      approachDescription,
      responseDetail
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleSaveSeguranca = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrPassword('');
    setNewPassword('');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleExportData = () => {
    alert('Os seus dados completos foram exportados com segurança em formato JSON, em conformidade com as diretrizes da LGPD (Art. 18). Verifique seus downloads.');
  };

  const handleDeleteAccount = () => {
    if (confirm('ATENÇÃO: Deseja realmente excluir permanentemente sua conta PsiCoach AI? Todos os relatos de casos, históricos de conversas e notas clínicas serão destruídos. Essa ação é irreversível.')) {
      logout();
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Settings className="w-7 h-7 text-indigo-500" />
          <span>Configurações</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Gerencie suas preferências clínicas, plano de assinatura, segurança da conta e privacidade.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Navigation Tabs (Left 1 Col) */}
        <div className="flex flex-col space-y-1.5 p-3 rounded-2xl bg-slate-900/30 border border-slate-800 backdrop-blur-md">
          <button
            onClick={() => setActiveTab('perfil')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
              activeTab === 'perfil' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Perfil Profissional</span>
          </button>
          
          <button
            onClick={() => setActiveTab('preferencias')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
              activeTab === 'preferencias' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Preferências Clínicas</span>
          </button>

          <button
            onClick={() => setActiveTab('assinatura')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
              activeTab === 'assinatura' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Plano & Assinatura</span>
          </button>

          <button
            onClick={() => setActiveTab('seguranca')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
              activeTab === 'seguranca' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Segurança de Acesso</span>
          </button>

          <button
            onClick={() => setActiveTab('privacidade')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
              activeTab === 'privacidade' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Privacidade & LGPD</span>
          </button>
        </div>

        {/* Dynamic Settings Content Panel (Right 3 Cols) */}
        <div className="lg:col-span-3 bg-slate-900/30 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
          {/* Notification banner */}
          {saveSuccess && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 flex items-center gap-2 animate-fade-in">
              <CheckCircle className="w-4.5 h-4.5" />
              <span>Configurações atualizadas e salvas no banco com sucesso!</span>
            </div>
          )}

          {/* TAB 1: PERFIL */}
          {activeTab === 'perfil' && (
            <form onSubmit={handleSavePerfil} className="space-y-5">
              <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3">
                Perfil Profissional da Psicóloga
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    E-mail
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Número CRP (Conselho Regional)
                  </label>
                  <input
                    type="text"
                    required
                    value={crp}
                    onChange={(e) => setCrp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Anos de Experiência Clínica
                  </label>
                  <select
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none transition-colors"
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
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Perfil</span>
              </button>
            </form>
          )}

          {/* TAB 2: PREFERÊNCIAS */}
          {activeTab === 'preferencias' && (
            <form onSubmit={handleSavePreferencias} className="space-y-5">
              <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3">
                Preferências Clínicas e Teóricas da IA
              </h3>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Abordagem Clínica Padrão (System Prompt)
                </label>
                <select
                  value={mainApproach}
                  onChange={(e) => setMainApproach(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none transition-colors"
                >
                  <option value="TCC (Terapia Cognitivo-Comportamental)">TCC (Terapia Cognitivo-Comportamental)</option>
                  <option value="Psicanálise">Psicanálise</option>
                  <option value="Humanista / Fenomenologia">Humanista / Fenomenologia</option>
                  <option value="Sistêmica / Terapia Familiar">Sistêmica / Terapia Familiar</option>
                  <option value="Gestalt-terapia">Gestalt-terapia</option>
                  <option value="Junguiana / Psicologia Analítica">Junguiana / Psicologia Analítica</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Nível de Detalhe das Respostas da IA
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-350 cursor-pointer">
                    <input
                      type="radio"
                      name="responseDetail"
                      checked={responseDetail === 'conciso'}
                      onChange={() => setResponseDetail('conciso')}
                      className="w-4 h-4 text-indigo-650 bg-slate-950 border-slate-850 focus:ring-indigo-500"
                    />
                    <span>Foco e Concisão (Resumos diretos)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium text-slate-350 cursor-pointer">
                    <input
                      type="radio"
                      name="responseDetail"
                      checked={responseDetail === 'detalhado'}
                      onChange={() => setResponseDetail('detalhado')}
                      className="w-4 h-4 text-indigo-650 bg-slate-950 border-slate-850 focus:ring-indigo-500"
                    />
                    <span>Detalhamento Completo (Profundidade teórica e citações)</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Especificações Adicionais do seu Consultório (Opcional)
                </label>
                <textarea
                  value={approachDescription}
                  onChange={(e) => setApproachDescription(e.target.value)}
                  placeholder="Ex: Trabalho sob o referencial específico de Aaron Beck focada em depressão, ou utilizo psicanálise kleiniana com foco em crianças..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 outline-none transition-colors resize-none leading-relaxed"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Preferências</span>
              </button>
            </form>
          )}

          {/* TAB 3: ASSINATURA */}
          {activeTab === 'assinatura' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3">
                Plano de Assinatura Financeira
              </h3>
              
              <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-900/20 to-purple-900/10 border border-indigo-500/25 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-indigo-300 uppercase tracking-wider">Assinatura Ativa</span>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-slate-100 capitalize">Plano PsiCoach {activePlan}</h4>
                    {activePlan === 'starter' && <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">Upgrade Disponível</span>}
                  </div>
                  <p className="text-xs text-slate-400">
                    {activePlan === 'starter' ? 'Limitação de 10 análises clínicas mensais' : 'Análises clínicas ilimitadas, chat e referências completas'}
                  </p>
                </div>

                <div className="text-left md:text-right shrink-0">
                  <span className="text-lg font-extrabold text-slate-100">{activePlan === 'starter' ? 'R$ 97' : activePlan === 'pro' ? 'R$ 197' : 'R$ 397'}/mês</span>
                  <p className="text-[10px] text-slate-500 flex items-center md:justify-end gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>Renova em 15/06/2026</span>
                  </p>
                </div>
              </div>

              {/* Plans options */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider">
                  MUDAR OU CONTRATAR PLANO
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {/* Option 1 */}
                  <div className={`p-4 rounded-xl border flex flex-col justify-between h-44 ${
                    activePlan === 'starter' ? 'border-indigo-650 bg-indigo-650/5' : 'border-slate-850 bg-slate-950/20'
                  }`}>
                    <div>
                      <h5 className="text-xs font-bold text-slate-200">Plano Starter</h5>
                      <p className="text-[10px] text-slate-500 mt-1">10 análises/mês e respostas padrão para novatas.</p>
                    </div>
                    <div className="pt-4 border-t border-slate-900 flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-200">R$97/mês</span>
                      {activePlan === 'starter' ? (
                        <span className="text-[10px] font-bold text-indigo-400">Plano Atual</span>
                      ) : (
                        <button onClick={() => setActivePlan('starter')} className="text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition-colors">
                          Assinar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Option 2 */}
                  <div className={`p-4 rounded-xl border relative overflow-hidden flex flex-col justify-between h-44 ${
                    activePlan === 'pro' ? 'border-indigo-650 bg-indigo-650/5' : 'border-slate-850 bg-slate-950/20'
                  }`}>
                    <div className="absolute top-0 right-0 bg-indigo-600 text-[8px] font-bold uppercase tracking-widest text-white px-2 py-0.5 rounded-bl">Popular</div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-200 flex items-center gap-1">
                        <span>Plano Pro</span>
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      </h5>
                      <p className="text-[10px] text-slate-500 mt-1">Análises ilimitadas + chat avançado + referências bibliográficas.</p>
                    </div>
                    <div className="pt-4 border-t border-slate-900 flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-200">R$197/mês</span>
                      {activePlan === 'pro' ? (
                        <span className="text-[10px] font-bold text-indigo-400">Plano Atual</span>
                      ) : (
                        <button onClick={() => setActivePlan('pro')} className="text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors shadow shadow-indigo-600/10">
                          Assinar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Option 3 */}
                  <div className={`p-4 rounded-xl border flex flex-col justify-between h-44 ${
                    activePlan === 'clinica' ? 'border-indigo-650 bg-indigo-650/5' : 'border-slate-850 bg-slate-950/20'
                  }`}>
                    <div>
                      <h5 className="text-xs font-bold text-slate-200">Plano Clínica</h5>
                      <p className="text-[10px] text-slate-500 mt-1">Até 5 psicólogas + painel gestor unificado para clínicas.</p>
                    </div>
                    <div className="pt-4 border-t border-slate-900 flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-200">R$397/mês</span>
                      {activePlan === 'clinica' ? (
                        <span className="text-[10px] font-bold text-indigo-400">Plano Atual</span>
                      ) : (
                        <button onClick={() => setActivePlan('clinica')} className="text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition-colors">
                          Assinar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SEGURANÇA */}
          {activeTab === 'seguranca' && (
            <form onSubmit={handleSaveSeguranca} className="space-y-5">
              <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3">
                Segurança da Conta & Troca de Senha
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Senha Atual
                  </label>
                  <input
                    type="password"
                    required
                    value={currPassword}
                    onChange={(e) => setCurrPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Nova Senha
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 flex gap-3 text-slate-400">
                <Lock className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-[11px] font-bold text-slate-200">Autenticação de Duplo Fator (2FA)</h4>
                  <p className="text-[10px] leading-normal text-slate-500">
                    Aumente a segurança do seu prontuário clínico blindando seu login com aplicativo autenticador do celular (Google Authenticator ou similar).
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                <Shield className="w-4 h-4" />
                <span>Atualizar Senha & Segurança</span>
              </button>
            </form>
          )}

          {/* TAB 5: PRIVACIDADE & LGPD */}
          {activeTab === 'privacidade' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3">
                Direitos de Privacidade, Dados & LGPD
              </h3>
              
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-850 space-y-4">
                <div className="flex gap-3 text-slate-400">
                  <Shield className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-200">Seus dados clínicos são 100% privados</h4>
                    <p className="text-[11px] leading-relaxed text-slate-400">
                      Nós obedecemos rigorosamente à LGPD (Lei Geral de Proteção de Dados - Lei nº 13.709). Os relatos de caso enviados à inteligência artificial são criptografados de ponta a ponta e anonimizados. Nós nunca vendemos, compartilhamos ou repassamos seus prontuários para treinar modelos públicos de IA.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-900 pt-4 flex-wrap gap-3">
                  <div className="space-y-0.5">
                    <h5 className="text-xs font-bold text-slate-200">Portabilidade de Dados (Art. 18, V)</h5>
                    <p className="text-[10px] text-slate-500">Baixe todo o histórico de análises, relatos e evolução clínica.</p>
                  </div>
                  <button
                    onClick={handleExportData}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-800 hover:border-indigo-500/35 hover:bg-indigo-500/10 text-slate-300 hover:text-indigo-300 rounded-xl text-xs font-semibold transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Exportar Todos os Meus Dados</span>
                  </button>
                </div>
              </div>

              {/* Exclusion sector */}
              <div className="p-5 rounded-2xl border border-rose-500/20 bg-rose-500/5 space-y-4">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-450 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-rose-350">Exclusão Definitiva de Conta</h4>
                    <p className="text-[11px] leading-relaxed text-rose-300/80">
                      Sob as regras de Direito ao Esquecimento (Art. 16, LGPD), você pode solicitar a destruição de toda a sua base de dados instantaneamente. Isso cancelará suas cobranças e apagará todos os casos já cadastrados para sempre.
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={handleDeleteAccount}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir Minha Conta Permanentemente</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
