"use client";

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Package, 
  ShoppingCart, 
  Settings, 
  Search, 
  Bell, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Box, 
  Activity,
  LogOut,
  Sparkles,
  Inbox
} from 'lucide-react';
import Link from 'next/link';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

// Tipagens para o futuro backend
interface SalesData {
  name: string;
  ML: number;
  Amazon: number;
}

interface Metrics {
  faturamento: number;
  lucro: number;
  pedidos: number;
  ticketMedio: number;
  faturamentoTrend: number;
  lucroTrend: number;
  pedidosTrend: number;
  ticketTrend: number;
}

export default function Dashboard() {
  // Estados para integração real
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    faturamento: 0,
    lucro: 0,
    pedidos: 0,
    ticketMedio: 0,
    faturamentoTrend: 0,
    lucroTrend: 0,
    pedidosTrend: 0,
    ticketTrend: 0
  });
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulação de carregamento inicial aguardando backend
  useEffect(() => {
    const fetchRealData = async () => {
      // TODO: Chamada para API real (ex: /api/dashboard)
      // await fetch('/api/dashboard')
      
      setLoading(false);
    };
    fetchRealData();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="flex h-screen bg-[#0a0a0c] text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#121215] border-r border-white/10 flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Vortex<span className="text-indigo-400">AI</span></span>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1">
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 font-medium">
            <BarChart3 className="w-5 h-5" /> Dashboard
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <Package className="w-5 h-5" /> Produtos
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <ShoppingCart className="w-5 h-5" /> Pedidos
          </a>
          <Link href="/oportunidades" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <Activity className="w-5 h-5" /> Oportunidades
          </Link>
        </nav>

        <div className="p-4 mt-auto">
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <Settings className="w-5 h-5" /> Configurações
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors mt-1">
            <LogOut className="w-5 h-5" /> Sair
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto relative">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-[#0a0a0c]/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        )}

        {/* Topbar */}
        <header className="h-20 border-b border-white/10 flex items-center justify-between px-8 bg-[#121215]/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center bg-[#1c1c21] rounded-full px-4 py-2 w-96 border border-white/5">
            <Search className="w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Pesquisar produtos, pedidos..." 
              className="bg-transparent border-none outline-none ml-3 text-sm text-white placeholder-gray-500 w-full"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 relative rounded-full hover:bg-white/5 transition-colors">
              <Bell className="w-5 h-5 text-gray-400" />
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 border-2 border-[#0a0a0c] cursor-pointer flex items-center justify-center text-xs font-bold">
              AD
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Visão Geral</h1>
            <p className="text-gray-400 mt-1">Resumo das suas vendas reais.</p>
          </div>

          {/* Cards (Valores dinâmicos zerados) */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <Card title="Faturamento Total" value={formatCurrency(metrics.faturamento)} icon={<DollarSign className="w-5 h-5 text-green-400" />} trend={`${metrics.faturamentoTrend}%`} trendUp={metrics.faturamentoTrend >= 0} />
            <Card title="Lucro Líquido" value={formatCurrency(metrics.lucro)} icon={<Activity className="w-5 h-5 text-indigo-400" />} trend={`${metrics.lucroTrend}%`} trendUp={metrics.lucroTrend >= 0} />
            <Card title="Pedidos" value={metrics.pedidos.toString()} icon={<Box className="w-5 h-5 text-blue-400" />} trend={`${metrics.pedidosTrend}%`} trendUp={metrics.pedidosTrend >= 0} />
            <Card title="Ticket Médio" value={formatCurrency(metrics.ticketMedio)} icon={<ShoppingCart className="w-5 h-5 text-orange-400" />} trend={`${metrics.ticketTrend}%`} trendUp={metrics.ticketTrend >= 0} />
          </div>

          {/* Charts & Tables */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Main Chart */}
            <div className="xl:col-span-2 bg-[#121215] border border-white/10 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Desempenho de Vendas</h2>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-indigo-500"></span><span className="text-sm text-gray-400">Mercado Livre</span></div>
                  <div className="flex items-center gap-1.5 ml-4"><span className="w-3 h-3 rounded-full bg-orange-500"></span><span className="text-sm text-gray-400">Amazon</span></div>
                </div>
              </div>
              
              {salesData.length > 0 ? (
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorML" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorAmz" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="name" stroke="#52525b" axisLine={false} tickLine={false} tick={{fontSize: 12}} dy={10} />
                      <YAxis stroke="#52525b" axisLine={false} tickLine={false} tick={{fontSize: 12}} tickFormatter={(v) => `R$${v/1000}k`} dx={-10} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                        itemStyle={{ color: '#e4e4e7' }}
                      />
                      <Area type="monotone" dataKey="ML" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorML)" />
                      <Area type="monotone" dataKey="Amazon" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorAmz)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 w-full flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-white/5 rounded-xl">
                  <BarChart3 className="w-8 h-8 mb-3 opacity-50" />
                  <p>Aguardando integração de dados</p>
                </div>
              )}
            </div>

            {/* AI Assistant Mini */}
            <div className="bg-gradient-to-b from-[#18181c] to-[#121215] border border-indigo-500/20 rounded-2xl p-6 flex flex-col shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Assistente IA</h2>
                  <p className="text-xs text-gray-400">Insights Automáticos</p>
                </div>
              </div>
              
              <div className="flex-1 space-y-4">
                {insights.length > 0 ? (
                  insights.map((insight, index) => (
                    <div key={index} className="bg-[#1c1c21] p-4 rounded-xl border border-white/5 text-sm leading-relaxed text-gray-300">
                      {insight.content}
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center px-4">
                    <Inbox className="w-8 h-8 mb-3 opacity-50" />
                    <p className="text-sm">Nenhum insight gerado. Conecte suas contas para que a IA comece a analisar.</p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 relative">
                <input 
                  type="text" 
                  disabled
                  placeholder="Aguardando conexão..." 
                  className="w-full bg-[#1c1c21] rounded-lg px-4 py-3 pr-10 text-sm border border-white/10 outline-none opacity-50 cursor-not-allowed"
                />
                <button disabled className="absolute right-3 top-7 text-gray-600 cursor-not-allowed">
                  <Activity className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Card({ title, value, icon, trend, trendUp }: { title: string, value: string, icon: React.ReactNode, trend: string, trendUp: boolean }) {
  return (
    <div className="bg-[#121215] p-6 rounded-2xl border border-white/10 shadow-lg relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-indigo-500/10 transition-colors"></div>
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-white/5 rounded-lg border border-white/5">
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${trend === '0%' ? 'text-gray-500' : (trendUp ? 'text-green-400' : 'text-red-400')}`}>
          {trend !== '0%' && (trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />)}
          {trend !== '0%' ? trend : '-'}
        </div>
      </div>
      <div>
        <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold tracking-tight text-white">{value}</h3>
      </div>
    </div>
  );
}
