"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
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

interface Insight {
  content: string;
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
  const [insights, setInsights] = useState<Insight[]>([]);
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
              content: `Faturamento de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.metrics.faturamento)} nos últimos 30 dias, com ${data.metrics.pedidos} pedidos consolidados no Bling.`
            },
            {
              content: `O ticket médio atual é de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.metrics.ticketMedio)}. Revise títulos e fotos no Mercado Livre para melhorar a conversão.`
            }
          ]);
        } else {
          setInsights([]);
        }

        if (data.connected && data.message) {
          setToastMessage({
            type: 'error',
            text: data.message,
          });
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
      const callbackMessage = urlParams.get('bling_message');
      setToastMessage({
        type: 'error',
        text: callbackMessage || `Erro ao conectar Bling: ${urlParams.get('bling_error')}`,
      });
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      alert(`Falha na requisição: ${message}`);
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
    <div className="app-shell">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed right-5 top-5 z-50 flex items-center gap-3 rounded-[6px] border px-5 py-3 shadow-[0_12px_32px_rgba(30,36,32,0.16)] ${
          toastMessage.type === 'success' 
            ? 'border-[#9cc7b7] bg-[#e5f1ec] text-[#155c49]' 
            : 'border-[#d9aaa0] bg-[#f7e7e3] text-[#8a3326]'
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
      <main className="app-main">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#f2f2ed]/85 backdrop-blur-sm">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#b9c9c2] border-t-[#176b57]"></div>
          </div>
        )}

        {/* Topbar */}
        <header className="app-topbar">
          <div className="field hidden w-80 items-center px-3 py-2 md:flex">
            <Search className="h-4 w-4 text-[#888c85]" />
            <input 
              type="text" 
              placeholder="Pesquisar produtos, pedidos..." 
              className="ml-3 w-full border-none bg-transparent text-sm text-[#20221f] outline-none placeholder:text-[#9a9d97]"
            />
          </div>

          <div className="flex items-center gap-4">
            {/* Bling Integration Status Pill */}
            {isBlingConnected ? (
              <div className="flex items-center gap-2 rounded-[5px] border border-[#a9cbbf] bg-[#e5f1ec] px-3 py-1.5 text-xs font-medium text-[#155c49]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#237a61]"></span>
                <span>Bling ERP Conectado</span>
                <button 
                  onClick={fetchDashboard} 
                  disabled={syncing}
                  title="Sincronizar dados agora" 
                  className="rounded-[3px] p-1 hover:bg-[#cfe4dc]"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                </button>
                <button 
                  onClick={handleDisconnect} 
                  title="Desconectar Bling" 
                  className="rounded-[3px] p-1 text-[#6f736d] hover:bg-[#f3d9d4] hover:text-[#9b3b2d]"
                >
                  <Power className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConnectModal(true)}
                className="button-secondary px-3 text-xs"
              >
                <Link2 className="h-4 w-4 text-[#a25714]" />
                Conectar Bling ERP
              </button>
            )}

            <button className="icon-button" aria-label="Notificações">
              <Bell className="h-[18px] w-[18px]" />
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-[#26322c] text-[11px] font-semibold text-white">
              AD
            </div>
          </div>
        </header>

        <div className="app-content space-y-7">
          {/* Header Title */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="page-kicker mb-3">Resumo da operação</p>
              <h1 className="page-title">Visão geral</h1>
              <p className="page-description mt-2">
                {isBlingConnected 
                  ? 'Métricas consolidadas em tempo real via Bling ERP.' 
                  : 'Conecte sua conta do Bling ERP para sincronizar suas vendas reais.'}
              </p>
            </div>

            {!isBlingConnected && (
              <button
                onClick={() => setShowConnectModal(true)}
                className="button-primary self-start px-4 text-sm sm:self-auto"
              >
                <Link2 className="w-4 h-4" />
                Conectar com Bling
              </button>
            )}
          </div>

          {/* Cards de Métricas */}
          <div className="metric-strip grid-cols-2 xl:grid-cols-4">
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
            <section className="surface p-6 xl:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-semibold text-[#20221f]">Desempenho de vendas</h2>
                  <p className="mt-1 text-xs text-[#777b74]">Últimos 14 dias por canal</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#176b57]"></span><span className="text-xs text-[#6f736d]">Mercado Livre</span></div>
                  <div className="ml-3 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#bd6a24]"></span><span className="text-xs text-[#6f736d]">Amazon</span></div>
                </div>
              </div>
              
              {salesData.length > 0 && isBlingConnected ? (
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorML" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#176b57" stopOpacity={0.18}/>
                          <stop offset="95%" stopColor="#176b57" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorAmz" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#bd6a24" stopOpacity={0.16}/>
                          <stop offset="95%" stopColor="#bd6a24" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#303630" vertical={false} />
                      <XAxis dataKey="name" stroke="#8f978f" axisLine={false} tickLine={false} tick={{fontSize: 12}} dy={10} />
                      <YAxis stroke="#8f978f" axisLine={false} tickLine={false} tick={{fontSize: 12}} tickFormatter={(v) => `R$${v/1000}k`} dx={-10} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#171b18', borderColor: '#303630', borderRadius: '5px', color: '#f2f4f0' }}
                        itemStyle={{ color: '#f2f4f0' }}
                      />
                      <Area type="monotone" dataKey="ML" stroke="#176b57" strokeWidth={2} fillOpacity={1} fill="url(#colorML)" />
                      <Area type="monotone" dataKey="Amazon" stroke="#bd6a24" strokeWidth={2} fillOpacity={1} fill="url(#colorAmz)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-80 w-full flex-col items-center justify-center rounded-[5px] border border-dashed border-[#cfd1c9] p-6 text-center text-[#7b7f78]">
                  <BarChart3 className="mb-3 h-8 w-8 text-[#8a9d95]" />
                  <p className="text-sm font-medium text-[#41443f]">
                    {isBlingConnected ? 'Sem pedidos registrados nos últimos 14 dias' : 'Aguardando conexão com o Bling ERP'}
                  </p>
                  <p className="mt-1 max-w-sm text-xs text-[#7b7f78]">
                    {isBlingConnected 
                      ? 'Assim que novos pedidos forem faturados no Bling, a curva de vendas será desenhada aqui.' 
                      : 'Conecte sua conta do Bling para sincronizar faturamento e canais de venda em tempo real.'}
                  </p>
                  {!isBlingConnected && (
                    <button
                      onClick={() => setShowConnectModal(true)}
                      className="button-secondary mt-4 px-4 text-xs"
                    >
                      Conectar Agora
                    </button>
                  )}
                </div>
              )}
            </section>

            {/* AI Assistant Mini */}
            <aside className="surface flex flex-col p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-[5px] bg-[#dcebe5]">
                  <Activity className="h-[18px] w-[18px] text-[#176b57]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[#20221f]">Leitura operacional</h2>
                  <p className="text-xs text-[#777b74]">Sinais encontrados nos dados</p>
                </div>
              </div>
              
              <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px] pr-1">
                {insights.length > 0 ? (
                  insights.map((insight, index) => (
                    <div key={index} className="rounded-[5px] border border-[#dfe0d8] bg-[#f4f4ef] p-4 text-sm leading-relaxed text-[#4d514b]">
                      {insight.content}
                    </div>
                  ))
                ) : (
                  <div className="flex h-full flex-col items-center justify-center px-4 py-8 text-center text-[#81857e]">
                    <Inbox className="w-8 h-8 mb-3 opacity-50" />
                    <p className="text-sm">
                      {isBlingConnected 
                        ? 'Processando histórico de pedidos para gerar insights estratégicos...' 
                        : 'Nenhum insight gerado. Conecte sua conta do Bling para que a IA comece a analisar seu faturamento.'}
                    </p>
                  </div>
                )}
              </div>

              <div className="relative mt-4 border-t border-[#dedfd8] pt-4">
                <input 
                  type="text" 
                  placeholder={isBlingConnected ? "Pergunte algo à IA sobre suas vendas..." : "Aguardando conexão..."} 
                  disabled={!isBlingConnected}
                  className="field w-full px-4 py-3 pr-10 text-sm outline-none placeholder:text-[#9a9d97] disabled:cursor-not-allowed disabled:opacity-50"
                />
                <button 
                  disabled={!isBlingConnected}
                  className="absolute right-3 top-7 text-[#176b57] hover:text-[#105746] disabled:cursor-not-allowed disabled:text-[#a5a8a2]"
                >
                  <Activity className="w-4 h-4" />
                </button>
              </div>
            </aside>
          </div>

          {/* Pedidos Recentes */}
          {isBlingConnected && recentOrders.length > 0 && (
            <section className="data-table">
              <div className="flex items-center justify-between border-b border-[#dedfd8] px-6 py-4">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-[18px] w-[18px] text-[#176b57]" />
                  <h2 className="text-base font-semibold">Pedidos recentes</h2>
                </div>
                <Link
                  href="/pedidos"
                  className="flex items-center gap-1.5 text-xs font-medium text-[#176b57] hover:text-[#105746]"
                >
                  Ver todos <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="divide-y divide-[#e3e4dd]">
                {recentOrders.slice(0, 5).map((order) => {
                  const sit = getSituacaoStyle(order.situacao?.id);
                  return (
                    <div key={order.id} className="data-table-row flex items-center justify-between gap-4 px-6 py-3.5">
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="shrink-0 font-mono text-sm font-semibold text-[#176b57]">#{order.numero}</span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[#31342f]">
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
                        <span className="data-number text-base font-semibold">
                          {formatCurrency(Number(order.total) || 0)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-center border-t border-[#dedfd8] px-6 py-3">
                <Link
                  href="/pedidos"
                  className="flex items-center gap-1.5 text-xs text-[#737770] hover:text-[#176b57]"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Ver histórico completo de pedidos
                </Link>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Modal de Conexão com o Bling */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e2420]/65 p-4 backdrop-blur-sm">
          <div className="surface relative w-full max-w-lg space-y-6 p-6 shadow-[0_24px_70px_rgba(25,31,27,0.24)]">
            <button 
              onClick={() => setShowConnectModal(false)}
              className="absolute right-5 top-5 text-[#777b74] hover:text-[#20221f]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-[#f1e2cf]">
                <Link2 className="h-5 w-5 text-[#9a571b]" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Conectar Bling ERP</h3>
                <p className="text-xs text-[#777b74]">Autorização oficial OAuth 2.0</p>
              </div>
            </div>

            <div className="surface-muted space-y-2 p-4 text-sm leading-relaxed text-[#545850]">
              <p className="font-semibold text-[#20221f]">Como funciona</p>
              <p>1. Clique no botão abaixo para abrir a tela de autorização oficial do Bling.</p>
              <p>2. Faça login e aprove somente os acessos a <strong>Pedidos de Venda</strong> e <strong>Produtos</strong>.</p>
              <p>3. Após aprovar, a conexão será concluída automaticamente.</p>
              <p className="border-t border-[#d7d8d0] pt-2 text-xs text-[#777b74]">Se a tela do Bling mostrar outros módulos, revise a Lista de escopos do aplicativo na Área do Integrador antes de continuar.</p>
            </div>

            {/* Opção 1: Redirecionamento Direto */}
            <div>
              <a
                href="/api/bling/authorize"
                className="button-primary w-full px-4 py-3"
              >
                <span>Autorizar no Bling ERP</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Divisor */}
            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-[#d7d8d0]"></div>
              <span className="bg-[#fbfbf8] px-3 text-xs text-[#7b7f78]">ou use o código</span>
            </div>

            {/* Opção 2: Inserir Código de Autorização ou URL */}
            <form onSubmit={handleManualCodeSubmit} className="space-y-3">
              <label className="block text-xs text-[#666a63]">
                Após autorizar no Bling, cole aqui o <code className="text-[#8a4c15]">code</code> ou o <code className="text-[#8a4c15]">link completo</code> da barra de endereço:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Ex: cole o link ou o código do Bling aqui"
                  className="field min-w-0 flex-1 px-4 py-2.5 text-sm outline-none placeholder:text-[#9a9d97]"
                />
                <button
                  type="submit"
                  disabled={modalSubmitting || !manualCode.trim()}
                  className="button-secondary shrink-0 px-4 py-2.5 text-xs disabled:opacity-50"
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
    <div className="metric-cell">
      <div className="flex justify-between items-start mb-4">
        <div className="rounded-[4px] bg-[#ecece5] p-2">
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${trend === '0%' ? 'text-[#8a8e87]' : (trendUp ? 'text-[#237a61]' : 'text-[#a44435]')}`}>
          {trend !== '0%' && (trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />)}
          {trend !== '0%' ? trend : '-'}
        </div>
      </div>
      <div>
        <p className="mb-1 text-xs font-medium text-[#737770]">{title}</p>
        <h3 className="data-number text-2xl font-semibold">{value}</h3>
      </div>
    </div>
  );
}
