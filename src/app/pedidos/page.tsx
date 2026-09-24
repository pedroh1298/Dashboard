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
  6:  { label: 'Em aberto',    color: 'text-[#8a5a12]', bg: 'bg-[#f5ead6] border-[#dfc99e]', icon: <Clock className="w-3.5 h-3.5" /> },
  9:  { label: 'Atendido',     color: 'text-[#176b57]', bg: 'bg-[#e5f1ec] border-[#b9d5ca]', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  11: { label: 'Cancelado',    color: 'text-[#9b3b2d]', bg: 'bg-[#f7e7e3] border-[#dfb8af]', icon: <XCircle className="w-3.5 h-3.5" /> },
  12: { label: 'Em andamento', color: 'text-[#315d74]', bg: 'bg-[#e3edf1] border-[#bfd0d8]', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  15: { label: 'Em digitação', color: 'text-[#666a63]', bg: 'bg-[#ecece5] border-[#d5d6ce]', icon: <Clock className="w-3.5 h-3.5" /> },
};

const PERIOD_OPTIONS = [
  { label: '7 dias',  days: 7 },
  { label: '30 dias', days: 30 },
  { label: '60 dias', days: 60 },
  { label: '90 dias', days: 90 },
];

function getSituacaoStyle(id?: number) {
  if (!id) return { label: 'Desconhecido', color: 'text-[#666a63]', bg: 'bg-[#ecece5] border-[#d5d6ce]', icon: <Clock className="w-3.5 h-3.5" /> };
  return SITUACOES[id] || { label: `Situação ${id}`, color: 'text-[#666a63]', bg: 'bg-[#ecece5] border-[#d5d6ce]', icon: <Clock className="w-3.5 h-3.5" /> };
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
    <div className="app-shell">
      <Sidebar />

      <main className="app-main">
        {/* Topbar */}
        <header className="app-topbar">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-[18px] w-[18px] text-[#176b57]" />
            <h1 className="text-sm font-semibold">Pedidos de venda</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setLoading(true); fetchOrders(selectedPeriod); }}
              disabled={syncing}
              className="button-secondary px-3 text-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <button className="icon-button" aria-label="Notificações">
              <Bell className="h-[18px] w-[18px]" />
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-[#26322c] text-[11px] font-semibold text-white">
              AD
            </div>
          </div>
        </header>

        <div className="app-content space-y-6">

          <div>
            <p className="page-kicker mb-3">Vendas</p>
            <h2 className="page-title">Pedidos</h2>
            <p className="page-description mt-2">Acompanhe o volume, o faturamento e o andamento dos pedidos registrados no Bling.</p>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-[#176b57]" />
              <p className="text-sm text-[#6f736d]">Buscando pedidos no Bling ERP...</p>
            </div>
          )}

          {!loading && !connectedBling && (
            <div className="surface flex flex-col items-center gap-4 p-8 text-center">
              <AlertCircle className="h-9 w-9 text-[#a25714]" />
              <div>
                <h3 className="text-lg font-semibold text-[#20221f]">Bling ERP não conectado</h3>
                <p className="mt-1 text-sm text-[#6f736d]">Conecte sua conta do Bling no painel para visualizar os pedidos.</p>
              </div>
              <Link href="/" className="button-primary px-5 text-sm">
                Ir para o Dashboard
              </Link>
            </div>
          )}

          {!loading && connectedBling && (
            <>
              {/* Filtros */}
              <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
                {/* Período */}
                <div className="surface flex items-center gap-1 p-1">
                  <Calendar className="w-4 h-4 text-gray-500 ml-2" />
                  {PERIOD_OPTIONS.map(opt => (
                    <button
                      key={opt.days}
                      onClick={() => handlePeriodChange(opt.days)}
                      className={`rounded-[4px] px-3 py-1.5 text-xs font-medium ${
                        selectedPeriod === opt.days
                          ? 'bg-[#26322c] text-white'
                          : 'text-[#666a63] hover:bg-[#ecece5] hover:text-[#20221f]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Situação */}
                <div className="surface flex flex-wrap items-center gap-1 p-1">
                  <Filter className="w-4 h-4 text-gray-500 ml-2" />
                  <button
                    onClick={() => setSelectedSituacao(null)}
                    className={`rounded-[4px] px-3 py-1.5 text-xs font-medium ${
                      selectedSituacao === null ? 'bg-[#26322c] text-white' : 'text-[#666a63] hover:bg-[#ecece5] hover:text-[#20221f]'
                    }`}
                  >
                    Todos
                  </button>
                  {Object.entries(SITUACOES).map(([id, s]) => (
                    <button
                      key={id}
                      onClick={() => setSelectedSituacao(Number(id))}
                      className={`rounded-[4px] px-3 py-1.5 text-xs font-medium ${
                        selectedSituacao === Number(id) ? 'bg-[#26322c] text-white' : 'text-[#666a63] hover:bg-[#ecece5] hover:text-[#20221f]'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Busca */}
                <div className="field flex min-w-[200px] flex-1 items-center gap-2 px-4 py-2">
                  <Search className="w-4 h-4 text-gray-500 shrink-0" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar por número, cliente..."
                    className="w-full border-none bg-transparent text-sm outline-none placeholder:text-[#9a9d97]"
                  />
                </div>
              </div>

              {/* Cards de resumo */}
              <div className="metric-strip grid-cols-2 lg:grid-cols-4">
                <div className="metric-cell">
                  <p className="mb-1 text-xs text-[#737770]">Total de pedidos</p>
                  <p className="data-number text-2xl font-semibold">{filteredOrders.length}</p>
                  <p className="mt-1 text-xs text-[#858981]">{selectedPeriod} dias</p>
                </div>
                <div className="metric-cell">
                  <p className="mb-1 text-xs text-[#737770]">Faturamento</p>
                  <p className="data-number text-xl font-semibold text-[#176b57]">{formatCurrency(totalFaturamento)}</p>
                  <p className="mt-1 text-xs text-[#858981]">período filtrado</p>
                </div>
                <div className="metric-cell">
                  <p className="mb-1 text-xs text-[#737770]">Ticket médio</p>
                  <p className="data-number text-xl font-semibold">{formatCurrency(ticketMedio)}</p>
                  <p className="mt-1 text-xs text-[#858981]">por pedido</p>
                </div>
                <div className="metric-cell">
                  <p className="mb-1 text-xs text-[#737770]">Atendidos</p>
                  <p className="data-number text-2xl font-semibold text-[#176b57]">
                    {filteredOrders.filter(o => o.situacao?.id === 9).length}
                  </p>
                  <p className="mt-1 text-xs text-[#858981]">
                    {filteredOrders.length > 0
                      ? `${((filteredOrders.filter(o => o.situacao?.id === 9).length / filteredOrders.length) * 100).toFixed(0)}% do total`
                      : '-'}
                  </p>
                </div>
              </div>

              {/* Tabela */}
              <div className="data-table">
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
                    <div className="hidden grid-cols-[60px_100px_1fr_140px_120px_100px_60px] gap-4 border-b border-[#dedfd8] bg-[#f4f4ef] px-6 py-3 text-[11px] font-semibold text-[#737770] md:grid">
                      <span>#</span>
                      <span>Número</span>
                      <span>Cliente</span>
                      <span>Data</span>
                      <span>Status</span>
                      <span className="text-right">Total</span>
                      <span></span>
                    </div>

                    <div className="divide-y divide-[#e3e4dd]">
                      {paginatedOrders.map((order, i) => {
                        const sit = getSituacaoStyle(order.situacao?.id);
                        return (
                          <div
                            key={order.id}
                            className="data-table-row grid grid-cols-1 items-center gap-2 px-6 py-4 md:grid-cols-[60px_100px_1fr_140px_120px_100px_60px] md:gap-4"
                          >
                            {/* Index */}
                            <span className="hidden md:block text-xs text-gray-600 font-mono">
                              {(currentPage - 1) * PAGE_SIZE + i + 1}
                            </span>

                            {/* Número */}
                            <div>
                              <span className="font-mono text-sm font-semibold text-[#176b57]">#{order.numero}</span>
                              {order.numeroLoja && (
                                <p className="text-xs text-gray-600 mt-0.5">{order.numeroLoja}</p>
                              )}
                            </div>

                            {/* Cliente */}
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-[#31342f]">
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
                              <span className="data-number text-base font-semibold">
                                {formatCurrency(Number(order.total) || 0)}
                              </span>
                            </div>

                            {/* Link */}
                            <div className="flex justify-end">
                              <a
                                href={`https://www.bling.com.br/pedidos.php#id=${order.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="icon-button text-[#777b74] hover:text-[#176b57]"
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
                      <div className="flex items-center justify-between border-t border-[#dedfd8] px-6 py-4">
                        <p className="text-xs text-gray-500">
                          Mostrando {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredOrders.length)} de {filteredOrders.length} pedidos
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="icon-button border border-[#d7d8d0] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-xs text-gray-400 px-2">{currentPage} / {totalPages}</span>
                          <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="icon-button border border-[#d7d8d0] disabled:cursor-not-allowed disabled:opacity-40"
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
