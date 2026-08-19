"use client";

import React from 'react';
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
  Sparkles
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const data = [
  { name: '1 Ago', ML: 4000, Amazon: 2400 },
  { name: '2 Ago', ML: 3000, Amazon: 1398 },
  { name: '3 Ago', ML: 2000, Amazon: 9800 },
  { name: '4 Ago', ML: 2780, Amazon: 3908 },
  { name: '5 Ago', ML: 1890, Amazon: 4800 },
  { name: '6 Ago', ML: 2390, Amazon: 3800 },
  { name: '7 Ago', ML: 3490, Amazon: 4300 },
];

export default function Dashboard() {
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
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <Activity className="w-5 h-5" /> Oportunidades
          </a>
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
      <main className="flex-1 flex flex-col overflow-y-auto">
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
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#121215]"></span>
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 border-2 border-[#0a0a0c] cursor-pointer"></div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Visão Geral</h1>
            <p className="text-gray-400 mt-1">Bem-vindo de volta! Aqui está o resumo das suas vendas nos últimos 30 dias.</p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <Card title="Faturamento Total" value="R$ 124.500" icon={<DollarSign className="w-5 h-5 text-green-400" />} trend="+14.5%" trendUp={true} />
            <Card title="Lucro Líquido" value="R$ 31.250" icon={<Activity className="w-5 h-5 text-indigo-400" />} trend="+8.2%" trendUp={true} />
            <Card title="Pedidos" value="1.284" icon={<Box className="w-5 h-5 text-blue-400" />} trend="-2.4%" trendUp={false} />
            <Card title="Ticket Médio" value="R$ 96,90" icon={<ShoppingCart className="w-5 h-5 text-orange-400" />} trend="+1.1%" trendUp={true} />
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
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                <div className="bg-[#1c1c21] p-4 rounded-xl border border-white/5 text-sm leading-relaxed text-gray-300">
                  <span className="text-white font-medium block mb-1">Oportunidade Encontrada!</span>
                  O produto "Fone Bluetooth X" teve um aumento de 45% nas buscas da Amazon. Sua margem permite baixar R$5,00 para ganhar a BuyBox.
                  <button className="mt-3 text-indigo-400 font-medium hover:text-indigo-300 transition-colors w-full text-left">Aplicar novo preço →</button>
                </div>
                
                <div className="bg-[#1c1c21] p-4 rounded-xl border border-white/5 text-sm leading-relaxed text-gray-300">
                  <span className="text-red-400 font-medium block mb-1">Alerta de Estoque</span>
                  "Kit Ferramentas 120 peças" esgotará em 4 dias no Mercado Livre no ritmo atual de vendas.
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 relative">
                <input 
                  type="text" 
                  placeholder="Pergunte algo sobre suas vendas..." 
                  className="w-full bg-[#1c1c21] rounded-lg px-4 py-3 pr-10 text-sm border border-white/10 outline-none focus:border-indigo-500 transition-colors"
                />
                <button className="absolute right-3 top-7 hover:text-indigo-400 transition-colors text-gray-500">
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
        <div className={`flex items-center gap-1 text-sm font-medium ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
          {trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {trend}
        </div>
      </div>
      <div>
        <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold tracking-tight text-white">{value}</h3>
      </div>
    </div>
  );
}
