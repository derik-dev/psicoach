'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Lock,
  Users,
  TrendingUp,
  DollarSign,
  UserCheck,
  UserX,
  Search,
  Eye,
  Settings,
  Sparkles,
  ArrowRightLeft
} from 'lucide-react';

interface MockUser {
  id: string;
  name: string;
  email: string;
  crp: string;
  plan: 'starter' | 'pro' | 'clinica';
  analysesCount: number;
  status: 'active' | 'past_due' | 'canceled';
  signUpDate: string;
  lastLogin: string;
}

const MOCK_USERS: MockUser[] = [
  {
    id: 'usr-1',
    name: 'Dr. Roberto Silveira',
    email: 'roberto.psic@gmail.com',
    crp: '06/98234-A',
    plan: 'pro',
    analysesCount: 42,
    status: 'active',
    signUpDate: '12/03/2026',
    lastLogin: 'Hoje, 15:40'
  },
  {
    id: 'usr-2',
    name: 'Dra. Gabriela Vasconcelos',
    email: 'gaby.terapia@yahoo.com',
    crp: '04/11029',
    plan: 'starter',
    analysesCount: 9,
    status: 'active',
    signUpDate: '01/04/2026',
    lastLogin: 'Ontem, 19:22'
  },
  {
    id: 'usr-3',
    name: 'Dr. Lucas Mendes',
    email: 'lucasmendes.psi@outlook.com',
    crp: '08/3342-PR',
    plan: 'clinica',
    analysesCount: 110,
    status: 'active',
    signUpDate: '15/01/2026',
    lastLogin: 'Hoje, 09:12'
  },
  {
    id: 'usr-4',
    name: 'Dra. Patricia Lima',
    email: 'pat.limapsico@gmail.com',
    crp: '06/74523',
    plan: 'starter',
    analysesCount: 10,
    status: 'past_due',
    signUpDate: '28/04/2026',
    lastLogin: 'Há 5 dias'
  },
  {
    id: 'usr-5',
    name: 'Dra. Juliana Antunes',
    email: 'ju.antunes@icloud.com',
    crp: '12/9903-SC',
    plan: 'pro',
    analysesCount: 33,
    status: 'canceled',
    signUpDate: '10/02/2026',
    lastLogin: 'Há 2 semanas'
  }
];

export default function AdminPanel() {
  const { user } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [usersList, setUsersList] = useState<MockUser[]>(MOCK_USERS);

  if (!user) return null;

  const filteredUsers = usersList.filter((u) => {
    return (
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.crp.includes(searchTerm)
    );
  });

  const handleImpersonate = (u: MockUser) => {
    alert(`[Simulação] Modo impersonar ativado. Agora você está visualizando o app temporariamente como ${u.name} (CRP ${u.crp}) para depuração clínica de erros.`);
  };

  const handleToggleStatus = (id: string) => {
    setUsersList((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const nextStatusMap: Record<MockUser['status'], MockUser['status']> = {
            active: 'past_due',
            past_due: 'canceled',
            canceled: 'active'
          };
          return { ...u, status: nextStatusMap[u.status] };
        }
        return u;
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Lock className="w-7 h-7 text-indigo-500" />
          <span>Painel Administrativo Interno</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Acesso restrito. Monitore faturamento mensal (MRR), métricas de churn de assinaturas e usuários cadastrados no sistema.
        </p>
      </div>

      {/* Grid Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800 backdrop-blur-md flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-indigo-650/15 border border-indigo-500/25 text-indigo-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">MRR Total</span>
            <span className="text-xl font-bold text-slate-100">R$ 19.820,00</span>
            <span className="text-[9px] text-emerald-400 font-semibold block mt-0.5">+12.4% este mês</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800 backdrop-blur-md flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-purple-650/15 border border-purple-500/25 text-purple-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Usuárias Ativas</span>
            <span className="text-xl font-bold text-slate-100">124 psicólogas</span>
            <span className="text-[9px] text-indigo-300 font-semibold block mt-0.5">85% plano Pro ou Clínica</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800 backdrop-blur-md flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-rose-650/15 border border-rose-500/25 text-rose-450">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Taxa de Churn</span>
            <span className="text-xl font-bold text-slate-100">2.4%</span>
            <span className="text-[9px] text-emerald-400 font-semibold block mt-0.5">Meta: abaixo de 5% (Meta batida)</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800 backdrop-blur-md flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-emerald-650/15 border border-emerald-500/25 text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total de Análises</span>
            <span className="text-xl font-bold text-slate-100">4.820 feitas</span>
            <span className="text-[9px] text-indigo-300 font-semibold block mt-0.5">Média: 38.8/usuária</span>
          </div>
        </div>
      </div>

      {/* User Management Section */}
      <div className="p-6 rounded-3xl bg-slate-900/30 border border-slate-800 backdrop-blur-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-5 rounded-full bg-indigo-500" />
            <span>Gerenciar Usuárias Cadastradas</span>
          </h2>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar nome, email ou CRP..."
              className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-650 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Table of Users */}
        <div className="overflow-x-auto border border-slate-850 rounded-2xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-850 text-slate-400 font-bold uppercase tracking-wider">
                <th className="p-4">Psicóloga / Contato</th>
                <th className="p-4">CRP</th>
                <th className="p-4">Plano</th>
                <th className="p-4 text-center">Análises</th>
                <th className="p-4">Status</th>
                <th className="p-4">Cadastro</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 bg-slate-900/10">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                  {/* Name */}
                  <td className="p-4">
                    <div className="font-bold text-slate-200">{u.name}</div>
                    <div className="text-[10px] text-slate-500">{u.email}</div>
                  </td>
                  
                  {/* CRP */}
                  <td className="p-4 text-slate-350 font-mono font-medium">{u.crp}</td>
                  
                  {/* Plan */}
                  <td className="p-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded capitalize bg-slate-950 border border-slate-850 text-slate-350">
                      {u.plan}
                    </span>
                  </td>

                  {/* Analyses count */}
                  <td className="p-4 text-center font-bold text-slate-200">{u.analysesCount}</td>

                  {/* Status */}
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                      u.status === 'active'
                        ? 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400'
                        : u.status === 'past_due'
                          ? 'bg-amber-500/15 border-amber-500/20 text-amber-400'
                          : 'bg-rose-500/15 border-rose-500/20 text-rose-450'
                    }`}>
                      {u.status === 'active' ? 'Ativo' : u.status === 'past_due' ? 'Atrasado' : 'Cancelado'}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="p-4 text-slate-450 font-medium">
                    <div>{u.signUpDate}</div>
                    <div className="text-[9px] text-slate-500">Último: {u.lastLogin}</div>
                  </td>

                  {/* Actions */}
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleImpersonate(u)}
                        title="Impersonar Psicóloga (Ver app como ela)"
                        className="p-1.5 bg-slate-950 hover:bg-indigo-600/15 border border-slate-850 hover:border-indigo-500/30 text-indigo-400 rounded-lg transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      
                      <button
                        onClick={() => handleToggleStatus(u.id)}
                        title="Alterar Status Financeiro (Simulação)"
                        className="p-1.5 bg-slate-950 hover:bg-purple-650/15 border border-slate-850 hover:border-purple-500/30 text-purple-400 rounded-lg transition-all"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
