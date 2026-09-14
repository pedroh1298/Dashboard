"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  ShoppingCart, 
  Search, 
  Bell, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Box, 
  Activity, 
  Sparkles,
  Inbox,
  RefreshCw,
  Link2,
  Power,
  CheckCircle2,
  X,
  AlertCircle,
  Calendar,
  Clock,
  ExternalLink,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface SalesData {
  name: string;
  ML: number;
  Amazon: number;
  Total?: number;
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

interface RecentOrder {
  id: number;
  numero: number;
  data: string;
  total: number;
  contato?: { nome?: string };
  situacao?: { id: number; valor?: string };
}

export default function Dashboard() {
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
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBlingConnected, setIsBlingConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setSyncing(true);
      const res = await fetch('/api/dashboard');
      const data = await res.json();

      if (data.success) {
        setIsBlingConnected(data.connected);
        if (data.metrics) setMetrics(data.metrics);
        if (data.salesData) setSalesData(data.salesData);
        if (data.recentOrders) setRecentOrders(data.recentOrders);

        if (data.connected && data.metrics?.faturamento > 0) {
          setInsights([
            {
              content: `🚀 Faturamento de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.metrics.faturamento)} nos últimos 30 dias com ${data.metrics.pedidos} pedidos consolidados no Bling.`
            },
            {
              content: `💡 Seu ticket médio atual é de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.metrics.ticketMedio)}. Otimize títulos e fotos no Mercado Livre para alavancar a taxa de conversão.`
            }
          ]);
        } else {
          setInsights([]);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar dados do dashboard:', err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    // Verifica parâmetros de callback na URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('bling_connected') === 'true') {
      setToastMessage({ type: 'success', text: 'Bling ERP conectado com sucesso!' });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('bling_error')) {
      setToastMessage({ type: 'error', text: `Erro ao conectar Bling: ${urlParams.get('bling_error')}` });
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    fetchDashboard();
  }, [fetchDashboard]);

  const handleDisconnect = async () => {
    if (!confirm('Deseja realmente desconectar a integração com o Bling ERP?')) return;
    try {
      setLoading(true);
      await fetch('/api/bling/status', { method: 'DELETE' });
      setToastMessage({ type: 'success', text: 'Bling desconectado com sucesso.' });
      setIsBlingConnected(false);
      fetchDashboard();
    } catch {
      setToastMessage({ type: 'error', text: 'Falha ao desconectar.' });
    } finally {
      setLoading(false);
    }
  };

  const handleManualCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    setModalSubmitting(true);
    try {
      const res = await fetch('/api/bling/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: manualCode.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage({ type: 'success', text: 'Bling ERP autenticado com sucesso!' });
        setShowConnectModal(false);
        setManualCode('');
        fetchDashboard();
      } else {
        alert(data.error || 'Erro ao validar o código do Bling.');
      }
    } catch (err: any) {
      alert(`Falha na requisição: ${err.message}`);
    } finally {
      setModalSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.substring(0, 10).split('-');
    return `${day}/${month}/${year}`;
  };

  const getSituacaoStyle = (id?: number) => {
    const map: Record<number, { label: string; color: string }> = {
      6:  { label: 'Em aberto',    color: 'text-yellow-400' },
      9:  { label: 'Atendido',     color: 'text-emerald-400' },
      11: { label: 'Cancelado',    color: 'text-red-400' },
      12: { label: 'Em andamento', color: 'text-blue-400' },
    };
    return map[id ?? 0] || { label: 'Outro', color: 'text-gray-400' };
  };

  return (
    <div className="flex h-screen bg-[#0a0a0c] text-white font-sans overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border backdrop-blur-xl animate-in slide-in-from-top-5 duration-300 ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300' 
            : 'bg-red-950/90 border-red-500/40 text-red-300'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <Sidebar />

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
            {/* Bling Integration Status Pill */}
            {isBlingConnected ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Bling ERP Conectado</span>
                <button 
                  onClick={fetchDashboard} 
                  disabled={syncing}
                  title="Sincronizar dados agora" 
                  className="p-1 hover:bg-emerald-500/20 rounded-md transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                </button>
                <button 
                  onClick={handleDisconnect} 
                  title="Desconectar Bling" 
                  className="p-1 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-md transition-colors"
                >
                  <Power className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConnectModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold shadow-lg shadow-amber-500/10 transition-all active:scale-95"
              >
                <Link2 className="w-4 h-4 text-amber-400" />
                Conectar Bling ERP
              </button>
            )}

            <button className="p-2 relative rounded-full hover:bg-white/5 transition-colors">
              <Bell className="w-5 h-5 text-gray-400" />
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 border-2 border-[#0a0a0c] cursor-pointer flex items-center justify-center text-xs font-bold">
              AD
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
          {/* Header Title */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Visão Geral</h1>
              <p className="text-gray-400 mt-1">
                {isBlingConnected 
                  ? 'Métricas consolidadas em tempo real via Bling ERP.' 
                  : 'Conecte sua conta do Bling ERP para sincronizar suas vendas reais.'}
              </p>
            </div>

            {!isBlingConnected && (
              <button
                onClick={() => setShowConnectModal(true)}
                className="self-start sm:self-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow-lg shadow-indigo-500/25 transition-all"
              >
                <Link2 className="w-4 h-4" />
                Conectar com Bling
              </button>
            )}
          </div>

          {/* Cards de Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <Card 
              title="Faturamento (30d)" 
              value={formatCurrency(metrics.faturamento)} 
              icon={<DollarSign className="w-5 h-5 text-green-400" />} 
              trend={`${metrics.faturamentoTrend}%`} 
              trendUp={metrics.faturamentoTrend >= 0} 
            />
            <Card 
              title="Lucro Líquido Est." 
              value={formatCurrency(metrics.lucro)} 
              icon={<Activity className="w-5 h-5 text-indigo-400" />} 
              trend={`${metrics.lucroTrend}%`} 
              trendUp={metrics.lucroTrend >= 0} 
            />
            <Card 
              title="Pedidos de Venda" 
              value={metrics.pedidos.toString()} 
              icon={<Box className="w-5 h-5 text-blue-400" />} 
              trend={`${metrics.pedidosTrend}%`} 
              trendUp={metrics.pedidosTrend >= 0} 
            />
            <Card 
              title="Ticket Médio" 
              value={formatCurrency(metrics.ticketMedio)} 
              icon={<ShoppingCart className="w-5 h-5 text-orange-400" />} 
              trend={`${metrics.ticketTrend}%`} 
              trendUp={metrics.ticketTrend >= 0} 
            />
          </div>

          {/* Charts & AI Assistant */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Main Chart */}
            <div className="xl:col-span-2 bg-[#121215] border border-white/10 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold">Desempenho de Vendas (Últimos 14 Dias)</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Distribuição diária de pedidos e faturamento</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-indigo-500"></span><span className="text-sm text-gray-400">Mercado Livre</span></div>
                  <div className="flex items-center gap-1.5 ml-4"><span className="w-3 h-3 rounded-full bg-orange-500"></span><span className="text-sm text-gray-400">Amazon</span></div>
                </div>
              </div>
              
              {salesData.length > 0 && isBlingConnected ? (
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
                <div className="h-80 w-full flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-white/5 rounded-xl p-6 text-center">
                  <BarChart3 className="w-10 h-10 mb-3 opacity-40 text-indigo-400" />
                  <p className="text-base font-medium text-gray-300">
                    {isBlingConnected ? 'Sem pedidos registrados nos últimos 14 dias' : 'Aguardando conexão com o Bling ERP'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm">
                    {isBlingConnected 
                      ? 'Assim que novos pedidos forem faturados no Bling, a curva de vendas será desenhada aqui.' 
                      : 'Conecte sua conta do Bling para sincronizar faturamento e canais de venda em tempo real.'}
                  </p>
                  {!isBlingConnected && (
                    <button
                      onClick={() => setShowConnectModal(true)}
                      className="mt-4 px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold transition-all"
                    >
                      Conectar Agora
                    </button>
                  )}
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
                  <p className="text-xs text-gray-400">Insights Inteligentes</p>
                </div>
              </div>
              
              <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px] pr-1">
                {insights.length > 0 ? (
                  insights.map((insight, index) => (
                    <div key={index} className="bg-[#1c1c21] p-4 rounded-xl border border-white/5 text-sm leading-relaxed text-gray-300">
                      {insight.content}
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center px-4 py-8">
                    <Inbox className="w-8 h-8 mb-3 opacity-50" />
                    <p className="text-sm">
                      {isBlingConnected 
                        ? 'Processando histórico de pedidos para gerar insights estratégicos...' 
                        : 'Nenhum insight gerado. Conecte sua conta do Bling para que a IA comece a analisar seu faturamento.'}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 relative">
                <input 
                  type="text" 
                  placeholder={isBlingConnected ? "Pergunte algo à IA sobre suas vendas..." : "Aguardando conexão..."} 
                  disabled={!isBlingConnected}
                  className="w-full bg-[#1c1c21] rounded-lg px-4 py-3 pr-10 text-sm border border-white/10 outline-none placeholder-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white focus:border-indigo-500 transition-colors"
                />
                <button 
                  disabled={!isBlingConnected}
                  className="absolute right-3 top-7 text-indigo-400 hover:text-indigo-300 disabled:text-gray-600 disabled:cursor-not-allowed"
                >
                  <Activity className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Pedidos Recentes */}
          {isBlingConnected && recentOrders.length > 0 && (
            <div className="bg-[#121215] border border-white/10 rounded-2xl shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-lg font-semibold">Pedidos Recentes</h2>
                </div>
                <a
                  href="/pedidos"
                  className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
                >
                  Ver todos <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="divide-y divide-white/5">
                {recentOrders.slice(0, 5).map((order) => {
                  const sit = getSituacaoStyle(order.situacao?.id);
                  return (
                    <div key={order.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-white/[0.02] transition-colors gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="font-mono text-sm text-indigo-300 font-bold shrink-0">#{order.numero}</span>
                        <div className="min-w-0">
                          <p className="text-sm text-gray-200 font-medium truncate">
                            {order.contato?.nome || 'Cliente não informado'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Clock className="w-3 h-3 text-gray-600" />
                            <span className="text-xs text-gray-500">{formatDate(order.data)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className={`text-xs font-medium ${sit.color}`}>{sit.label}</span>
                        <span className="text-base font-bold text-white">
                          {formatCurrency(Number(order.total) || 0)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-6 py-3 border-t border-white/10 flex justify-center">
                <a
                  href="/pedidos"
                  className="text-xs text-gray-500 hover:text-indigo-400 transition-colors flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Ver histórico completo de pedidos
                </a>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal de Conexão com o Bling */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-white/15 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-6 animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowConnectModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Link2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Conectar Bling ERP (v3)</h3>
                <p className="text-xs text-gray-400">Integração oficial OAuth 2.0</p>
              </div>
            </div>

            <div className="bg-[#1c1c21] p-4 rounded-xl border border-white/5 space-y-2 text-sm text-gray-300 leading-relaxed">
              <p className="font-semibold text-white">Como funciona:</p>
              <p>1. Clique no botão abaixo para abrir a tela de autorização oficial do Bling.</p>
              <p>2. Faça login e aprove as permissões do aplicativo <strong>VortexAI</strong>.</p>
              <p>3. Após aprovar, a conexão será concluída automaticamente!</p>
            </div>

            {/* Opção 1: Redirecionamento Direto */}
            <div>
              <a
                href="/api/bling/authorize"
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98]"
              >
                <span>Autorizar no Bling ERP</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Divisor */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-white/10 w-full"></div>
              <span className="bg-[#121215] px-3 text-xs text-gray-500 uppercase tracking-wider">ou manual</span>
            </div>

            {/* Opção 2: Inserir Código de Autorização ou URL */}
            <form onSubmit={handleManualCodeSubmit} className="space-y-3">
              <label className="block text-xs text-gray-400">
                Após autorizar no Bling, cole aqui o <code className="text-amber-300">code</code> ou o <code className="text-amber-300">link completo</code> da barra de endereço:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Ex: cole o link ou o código do Bling aqui"
                  className="flex-1 bg-[#1c1c21] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  disabled={modalSubmitting || !manualCode.trim()}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors shrink-0"
                >
                  {modalSubmitting ? 'Validando...' : 'Concluir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
