'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Lock,
  Users,
  TrendingUp,
  DollarSign,
  UserX,
  Search,
  Eye,
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
  { id: 'usr-1', name: 'Dr. Roberto Silveira', email: 'roberto.psic@gmail.com', crp: '06/98234-A', plan: 'pro', analysesCount: 42, status: 'active', signUpDate: '12/03/2026', lastLogin: 'Hoje, 15:40' },
  { id: 'usr-2', name: 'Dra. Gabriela Vasconcelos', email: 'gaby.terapia@yahoo.com', crp: '04/11029', plan: 'starter', analysesCount: 9, status: 'active', signUpDate: '01/04/2026', lastLogin: 'Ontem, 19:22' },
  { id: 'usr-3', name: 'Dr. Lucas Mendes', email: 'lucasmendes.psi@outlook.com', crp: '08/3342-PR', plan: 'clinica', analysesCount: 110, status: 'active', signUpDate: '15/01/2026', lastLogin: 'Hoje, 09:12' },
  { id: 'usr-4', name: 'Dra. Patricia Lima', email: 'pat.limapsico@gmail.com', crp: '06/74523', plan: 'starter', analysesCount: 10, status: 'past_due', signUpDate: '28/04/2026', lastLogin: 'Há 5 dias' },
  { id: 'usr-5', name: 'Dra. Juliana Antunes', email: 'ju.antunes@icloud.com', crp: '12/9903-SC', plan: 'pro', analysesCount: 33, status: 'canceled', signUpDate: '10/02/2026', lastLogin: 'Há 2 semanas' }
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
    alert(`[Simulação] Modo impersonar ativado. Agora você está visualizando o app como ${u.name} (CRP ${u.crp}).`);
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

  const metrics = [
    { label: 'MRR Total', value: 'R$ 19.820', sub: '+12.4% este mês', icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Usuárias Ativas', value: '124', sub: '85% plano Pro/Clínica', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Taxa de Churn', value: '2.4%', sub: 'Meta abaixo de 5%', icon: UserX, color: 'text-rose-500', bg: 'bg-rose-50' },
    { label: 'Análises Totais', value: '4.820', sub: 'Média 38.8/usuária', icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-50' }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="surface-card p-7 lg:p-10 space-y-4">
        <div className="section-badge">
          <Lock className="w-3 h-3 text-blue-600" />
          <span>Acesso Restrito</span>
        </div>
        <h1 className="page-headline">
          Painel <span className="page-headline-accent">administrativo.</span>
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">
          Monitore faturamento mensal (MRR), métricas de churn e usuárias cadastradas no sistema.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
              <div className={`p-3.5 rounded-xl ${m.bg} ${m.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block">{m.label}</span>
                <span className="text-xl font-light text-slate-900 tracking-tight">{m.value}</span>
                <span className="text-[9px] text-slate-400 font-medium block mt-0.5">{m.sub}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* User table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <span className="w-1.5 h-5 rounded-full bg-blue-600" />
            <span>Gerenciar usuárias</span>
          </h2>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar nome, email ou CRP..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 placeholder-slate-400 outline-none transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-2xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="p-4">Psicóloga</th>
                <th className="p-4">CRP</th>
                <th className="p-4">Plano</th>
                <th className="p-4 text-center">Análises</th>
                <th className="p-4">Status</th>
                <th className="p-4">Cadastro</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4">
                    <div className="font-semibold text-slate-800">{u.name}</div>
                    <div className="text-[10px] text-slate-400">{u.email}</div>
                  </td>
                  <td className="p-4 text-slate-600 font-mono">{u.crp}</td>
                  <td className="p-4">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded capitalize bg-blue-50 border border-blue-100 text-blue-700">
                      {u.plan}
                    </span>
                  </td>
                  <td className="p-4 text-center font-semibold text-slate-700">{u.analysesCount}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                      u.status === 'active'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : u.status === 'past_due'
                          ? 'bg-amber-50 border-amber-200 text-amber-700'
                          : 'bg-rose-50 border-rose-200 text-rose-700'
                    }`}>
                      {u.status === 'active' ? 'Ativo' : u.status === 'past_due' ? 'Atrasado' : 'Cancelado'}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500 font-medium">
                    <div>{u.signUpDate}</div>
                    <div className="text-[9px] text-slate-400">Último: {u.lastLogin}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleImpersonate(u)}
                        title="Impersonar"
                        className="p-1.5 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 text-blue-700 rounded-lg transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleToggleStatus(u.id)}
                        title="Alterar status"
                        className="p-1.5 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 text-slate-600 rounded-lg transition-all"
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
