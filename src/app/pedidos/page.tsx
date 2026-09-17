"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Bell,
  Search,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  AlertCircle,
  Package,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';

interface BlingOrder {
  id: number;
  numero: number;
  numeroLoja?: string;
  data: string;
  dataSaida?: string;
  total: number;
  contato?: { id?: number; nome?: string; tipoPessoa?: string };
  situacao?: { id: number; valor?: string };
  itens?: { id?: number; codigo?: string; descricao?: string; quantidade?: number; valor?: number }[];
}

const SITUACOES: Record<number, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  6:  { label: 'Em aberto',        color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/30',  icon: <Clock className="w-3.5 h-3.5" /> },
  9:  { label: 'Atendido',         color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  11: { label: 'Cancelado',        color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30',        icon: <XCircle className="w-3.5 h-3.5" /> },
  12: { label: 'Em andamento',     color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/30',      icon: <TrendingUp className="w-3.5 h-3.5" /> },
  15: { label: 'Em digitação',     color: 'text-gray-400',    bg: 'bg-gray-500/10 border-gray-500/30',      icon: <Clock className="w-3.5 h-3.5" /> },
};

const PERIOD_OPTIONS = [
  { label: '7 dias',  days: 7 },
  { label: '30 dias', days: 30 },
  { label: '60 dias', days: 60 },
  { label: '90 dias', days: 90 },
];

function getSituacaoStyle(id?: number) {
  if (!id) return { label: 'Desconhecido', color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/30', icon: <Clock className="w-3.5 h-3.5" /> };
  return SITUACOES[id] || { label: `Situação ${id}`, color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/30', icon: <Clock className="w-3.5 h-3.5" /> };
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  const [year, month, day] = dateStr.substring(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

const PAGE_SIZE = 15;

export default function PedidosPage() {
  const [orders, setOrders] = useState<BlingOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<BlingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [selectedSituacao, setSelectedSituacao] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [connectedBling, setConnectedBling] = useState(true);

  const buildDateParams = useCallback((days: number) => {
    const now = new Date();
    const from = new Date();
    from.setDate(now.getDate() - days);
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    return { dataInicial: fmt(from), dataFinal: fmt(now) };
  }, []);

  const fetchOrders = useCallback(async (days: number) => {
    setSyncing(true);
    setError('');
    try {
      const { dataInicial, dataFinal } = buildDateParams(days);
      const res = await fetch(`/api/pedidos?dataInicial=${dataInicial}&dataFinal=${dataFinal}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
        setConnectedBling(true);
      } else {
        setError(data.error || 'Erro ao buscar pedidos');
        setConnectedBling(false);
      }
    } catch {
      setError('Falha ao conectar com o servidor.');
      setConnectedBling(false);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [buildDateParams]);

  useEffect(() => {
    fetchOrders(selectedPeriod);
  }, [fetchOrders, selectedPeriod]);

  // Filtros client-side
  useEffect(() => {
    let result = [...orders];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(o =>
        o.numero.toString().includes(q) ||
        o.contato?.nome?.toLowerCase().includes(q) ||
        o.numeroLoja?.toLowerCase().includes(q)
      );
    }

    if (selectedSituacao !== null) {
      result = result.filter(o => o.situacao?.id === selectedSituacao);
    }

    setFilteredOrders(result);
    setCurrentPage(1);
  }, [orders, search, selectedSituacao]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const totalFaturamento = filteredOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const ticketMedio = filteredOrders.length > 0 ? totalFaturamento / filteredOrders.length : 0;

  const handlePeriodChange = (days: number) => {
    setSelectedPeriod(days);
    setCurrentPage(1);
    setLoading(true);
    fetchOrders(days);
  };

  return (
    <div className="flex h-screen bg-[#0a0a0c] text-white font-sans overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-y-auto relative">
        {/* Topbar */}
        <header className="h-20 border-b border-white/10 flex items-center justify-between px-8 bg-[#121215]/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-5 h-5 text-indigo-400" />
            <h1 className="font-bold text-lg">Pedidos de Venda</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setLoading(true); fetchOrders(selectedPeriod); }}
              disabled={syncing}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <button className="p-2 rounded-full hover:bg-white/5 transition-colors">
              <Bell className="w-5 h-5 text-gray-400" />
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 border-2 border-[#0a0a0c] flex items-center justify-center text-xs font-bold">
              AD
            </div>
          </div>
        </header>

        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
              <p className="text-gray-400 text-sm animate-pulse">Buscando pedidos no Bling ERP...</p>
            </div>
          )}

          {!loading && !connectedBling && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-8 flex flex-col items-center text-center gap-4">
              <AlertCircle className="w-10 h-10 text-amber-400" />
              <div>
                <h3 className="font-bold text-lg text-amber-300">Bling ERP não conectado</h3>
                <p className="text-gray-400 text-sm mt-1">Conecte sua conta do Bling no Dashboard para visualizar os pedidos.</p>
              </div>
              <Link href="/" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-all">
                Ir para o Dashboard
              </Link>
            </div>
          )}

          {!loading && connectedBling && (
            <>
              {/* Filtros */}
              <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
                {/* Período */}
                <div className="flex items-center gap-2 bg-[#121215] border border-white/10 rounded-xl p-1">
                  <Calendar className="w-4 h-4 text-gray-500 ml-2" />
                  {PERIOD_OPTIONS.map(opt => (
                    <button
                      key={opt.days}
                      onClick={() => handlePeriodChange(opt.days)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedPeriod === opt.days
                          ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Situação */}
                <div className="flex items-center gap-2 bg-[#121215] border border-white/10 rounded-xl p-1 flex-wrap">
                  <Filter className="w-4 h-4 text-gray-500 ml-2" />
                  <button
                    onClick={() => setSelectedSituacao(null)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedSituacao === null ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Todos
                  </button>
                  {Object.entries(SITUACOES).map(([id, s]) => (
                    <button
                      key={id}
                      onClick={() => setSelectedSituacao(Number(id))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedSituacao === Number(id) ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Busca */}
                <div className="flex items-center bg-[#121215] border border-white/10 rounded-xl px-4 py-2 flex-1 min-w-[200px] gap-2">
                  <Search className="w-4 h-4 text-gray-500 shrink-0" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar por número, cliente..."
                    className="bg-transparent border-none outline-none text-sm text-white placeholder-gray-600 w-full"
                  />
                </div>
              </div>

              {/* Cards de resumo */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#121215] border border-white/10 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Total de Pedidos</p>
                  <p className="text-2xl font-bold">{filteredOrders.length}</p>
                  <p className="text-xs text-gray-500 mt-1">{selectedPeriod} dias</p>
                </div>
                <div className="bg-[#121215] border border-white/10 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Faturamento</p>
                  <p className="text-xl font-bold text-emerald-400">{formatCurrency(totalFaturamento)}</p>
                  <p className="text-xs text-gray-500 mt-1">período filtrado</p>
                </div>
                <div className="bg-[#121215] border border-white/10 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Ticket Médio</p>
                  <p className="text-xl font-bold text-indigo-400">{formatCurrency(ticketMedio)}</p>
                  <p className="text-xs text-gray-500 mt-1">por pedido</p>
                </div>
                <div className="bg-[#121215] border border-white/10 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Atendidos</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    {filteredOrders.filter(o => o.situacao?.id === 9).length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {filteredOrders.length > 0
                      ? `${((filteredOrders.filter(o => o.situacao?.id === 9).length / filteredOrders.length) * 100).toFixed(0)}% do total`
                      : '-'}
                  </p>
                </div>
              </div>

              {/* Tabela */}
              <div className="bg-[#121215] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                {error && (
                  <div className="p-4 bg-red-500/10 border-b border-red-500/20 flex items-center gap-3 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                {filteredOrders.length === 0 && !error ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-500 text-center px-4">
                    <Package className="w-12 h-12 mb-4 opacity-30" />
                    <p className="text-base font-medium text-gray-400">Nenhum pedido encontrado</p>
                    <p className="text-sm mt-1">Tente ajustar o período ou os filtros aplicados.</p>
                  </div>
                ) : (
                  <>
                    {/* Header da tabela */}
                    <div className="hidden md:grid grid-cols-[60px_100px_1fr_140px_120px_100px_60px] gap-4 px-6 py-3 border-b border-white/5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <span>#</span>
                      <span>Número</span>
                      <span>Cliente</span>
                      <span>Data</span>
                      <span>Status</span>
                      <span className="text-right">Total</span>
                      <span></span>
                    </div>

                    <div className="divide-y divide-white/5">
                      {paginatedOrders.map((order, i) => {
                        const sit = getSituacaoStyle(order.situacao?.id);
                        return (
                          <div
                            key={order.id}
                            className="grid grid-cols-1 md:grid-cols-[60px_100px_1fr_140px_120px_100px_60px] gap-2 md:gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors items-center"
                          >
                            {/* Index */}
                            <span className="hidden md:block text-xs text-gray-600 font-mono">
                              {(currentPage - 1) * PAGE_SIZE + i + 1}
                            </span>

                            {/* Número */}
                            <div>
                              <span className="font-mono text-sm text-indigo-300 font-bold">#{order.numero}</span>
                              {order.numeroLoja && (
                                <p className="text-xs text-gray-600 mt-0.5">{order.numeroLoja}</p>
                              )}
                            </div>

                            {/* Cliente */}
                            <div className="min-w-0">
                              <p className="text-sm text-gray-200 font-medium truncate">
                                {order.contato?.nome || 'Cliente não informado'}
                              </p>
                              {order.itens && order.itens.length > 0 && (
                                <p className="text-xs text-gray-600 truncate mt-0.5">
                                  {order.itens.length} {order.itens.length === 1 ? 'item' : 'itens'}
                                  {order.itens[0]?.descricao ? ` · ${order.itens[0].descricao}` : ''}
                                </p>
                              )}
                            </div>

                            {/* Data */}
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <Calendar className="w-3.5 h-3.5 shrink-0 text-gray-600 hidden md:block" />
                              {formatDate(order.data)}
                            </div>

                            {/* Status */}
                            <div>
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${sit.bg} ${sit.color}`}>
                                {sit.icon}
                                {sit.label}
                              </span>
                            </div>

                            {/* Total */}
                            <div className="text-right">
                              <span className="text-base font-bold text-white">
                                {formatCurrency(Number(order.total) || 0)}
                              </span>
                            </div>

                            {/* Link */}
                            <div className="flex justify-end">
                              <a
                                href={`https://www.bling.com.br/pedidos.php#id=${order.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-500 hover:text-indigo-400"
                                title="Ver no Bling"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Paginação */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
                        <p className="text-xs text-gray-500">
                          Mostrando {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredOrders.length)} de {filteredOrders.length} pedidos
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-xs text-gray-400 px-2">{currentPage} / {totalPages}</span>
                          <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
