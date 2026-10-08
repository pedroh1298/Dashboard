"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
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
  Store,
  Warehouse,
  Truck,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import NotificationsButton from '@/components/NotificationsButton';

interface BlingOrder {
  id: number;
  numero: number;
  numeroLoja?: string;
  data: string;
  dataSaida?: string;
  dataPrevista?: string;
  total: number;
  contato?: { id?: number; nome?: string; tipoPessoa?: string };
  situacao?: { id: number; valor?: string };
  loja?: { id?: number; unidadeNegocio?: { id?: number } };
  itens?: { id?: number; codigo?: string; descricao?: string; quantidade?: number; valor?: number }[];
  operacao?: {
    channelId?: number;
    storeName: string;
    marketplace: string;
    businessUnitId?: number;
    businessUnitName: string;
    warehouseId?: number;
    warehouseName: string;
    fulfillment: OperationFilter;
    shippingMethod: ShippingMethod;
    shippingService?: string;
  };
  detailsLoaded?: boolean;
}

type OperationFilter = 'full' | 'matriz' | 'nao_identificado';
type ShippingMethod = 'full' | 'flex' | 'mercado_envios' | 'correios' | 'outro' | 'nao_identificado';
type MarketplaceFilter = 'mercado_livre' | 'amazon';

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

const OPERATION_OPTIONS: Array<{ value: OperationFilter | 'todos'; label: string }> = [
  { value: 'todos', label: 'Todas' },
  { value: 'matriz', label: 'Matriz' },
  { value: 'full', label: 'Full' },
];

const MARKETPLACE_OPTIONS: Array<{ value: MarketplaceFilter | 'todos'; label: string }> = [
  { value: 'todos', label: 'Todas' },
  { value: 'mercado_livre', label: 'Mercado Livre' },
  { value: 'amazon', label: 'Amazon' },
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

function getOperationStyle(operation?: OperationFilter) {
  if (operation === 'full') {
    return { label: 'FULL', className: 'border-[#355966] bg-[#1b3038] text-[#77afc2]' };
  }
  if (operation === 'matriz') {
    return { label: 'MATRIZ', className: 'border-[#376b5a] bg-[#19372e] text-[#8fd0ba]' };
  }
  return { label: 'MATRIZ', className: 'border-[#376b5a] bg-[#19372e] text-[#8fd0ba]' };
}

function marketplaceKey(value?: string): MarketplaceFilter {
  const normalized = (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (normalized.includes('mercado livre') || normalized.includes('mercadolivre')) return 'mercado_livre';
  if (normalized.includes('amazon')) return 'amazon';
  return 'mercado_livre';
}

function getMarketplaceStyle(marketplace?: string) {
  const key = marketplaceKey(marketplace);
  if (key === 'mercado_livre') return { label: 'MERCADO LIVRE', className: 'border-[#376b5a] bg-[#19372e] text-[#8fd0ba]' };
  if (key === 'amazon') return { label: 'AMAZON', className: 'border-[#66502a] bg-[#3a2c19] text-[#dca45e]' };
  return { label: 'MERCADO LIVRE', className: 'border-[#376b5a] bg-[#19372e] text-[#8fd0ba]' };
}

function getShippingStyle(method?: ShippingMethod, detailsLoaded?: boolean) {
  if (!detailsLoaded) return { label: 'CARREGANDO', className: 'border-[#465047] bg-[#20251f] text-[#8a938b]' };
  if (method === 'full') return { label: 'FULL', className: 'border-[#355966] bg-[#1b3038] text-[#77afc2]' };
  if (method === 'flex') return { label: 'FLEX', className: 'border-[#66502a] bg-[#3a2c19] text-[#e2b474]' };
  if (method === 'mercado_envios') return { label: 'MERCADO ENVIOS', className: 'border-[#376b5a] bg-[#19372e] text-[#8fd0ba]' };
  if (method === 'correios') return { label: 'CORREIOS', className: 'border-[#4a6070] bg-[#1b2b35] text-[#8fc1d7]' };
  if (method === 'outro') return { label: 'OUTRO', className: 'border-[#465047] bg-[#20251f] text-[#c1c7c1]' };
  return { label: 'NÃO IDENTIFICADO', className: 'border-[#5b4641] bg-[#2c211f] text-[#d39a8e]' };
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
  const [selectedOperation, setSelectedOperation] = useState<OperationFilter | 'todos'>('todos');
  const [selectedMarketplace, setSelectedMarketplace] = useState<MarketplaceFilter | 'todos'>('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [connectedBling, setConnectedBling] = useState(true);
  const requestedDetailIds = useRef(new Set<number>());

  const buildDateParams = useCallback((days: number) => {
    const now = new Date();
    const from = new Date();
    from.setDate(now.getDate() - days);
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    return { dataInicial: fmt(from), dataFinal: fmt(now) };
  }, []);

  const fetchOrders = useCallback(async (days: number, forceRefresh = false) => {
    setSyncing(true);
    setError('');
    try {
      const { dataInicial, dataFinal } = buildDateParams(days);
      const res = await fetch(`/api/pedidos?dataInicial=${dataInicial}&dataFinal=${dataFinal}${forceRefresh ? '&refresh=1' : ''}`);
      const data = await res.json();
      if (data.success) {
        requestedDetailIds.current.clear();
        setOrders((data.orders || []).map((order: BlingOrder) => ({ ...order, detailsLoaded: false })));
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
        o.numeroLoja?.toLowerCase().includes(q) ||
        o.operacao?.storeName.toLowerCase().includes(q) ||
        o.operacao?.marketplace.toLowerCase().includes(q) ||
        o.operacao?.warehouseName.toLowerCase().includes(q)
      );
    }

    if (selectedSituacao !== null) {
      result = result.filter(o => o.situacao?.id === selectedSituacao);
    }

    if (selectedOperation !== 'todos') {
      result = result.filter(o => o.operacao?.fulfillment === selectedOperation);
    }

    if (selectedMarketplace !== 'todos') {
      result = result.filter(o => marketplaceKey(o.operacao?.marketplace) === selectedMarketplace);
    }

    setFilteredOrders(result);
    setCurrentPage(1);
  }, [orders, search, selectedSituacao, selectedOperation, selectedMarketplace]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const paginatedOrderIds = paginatedOrders.map(order => order.id).join(',');

  useEffect(() => {
    if (!paginatedOrderIds) return;
    const ids = paginatedOrderIds
      .split(',')
      .map(Number)
      .filter(id => {
        const order = orders.find(item => item.id === id);
        return order && !order.detailsLoaded && !requestedDetailIds.current.has(id);
      });
    if (ids.length === 0) return;

    ids.forEach(id => requestedDetailIds.current.add(id));
    let cancelled = false;

    fetch(`/api/pedidos?ids=${ids.join(',')}`)
      .then(response => response.json())
      .then(data => {
        if (cancelled || !data.success) return;
        const details = new Map<number, BlingOrder>((data.orders || []).map((order: BlingOrder) => [order.id, order]));
        setOrders(current => current.map(order => {
          if (!ids.includes(order.id)) return order;
          const detail = details.get(order.id);
          if (!detail) return { ...order, detailsLoaded: true };
          const detailOperation = detail.operacao;
          const operation = detailOperation && order.operacao
            ? {
                ...detailOperation,
                fulfillment: detailOperation.fulfillment === 'full' || order.operacao.fulfillment === 'full'
                  ? 'full' as const
                  : 'matriz' as const,
              }
            : detailOperation || order.operacao;
          return { ...order, ...detail, operacao: operation, detailsLoaded: true };
        }));
      })
      .catch(() => {
        ids.forEach(id => requestedDetailIds.current.delete(id));
      });

    return () => { cancelled = true; };
  }, [orders, paginatedOrderIds]);

  const totalFaturamento = filteredOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const openOrders = filteredOrders.filter(order => order.situacao?.id === 6);
  const openMatriz = openOrders.filter(order => order.operacao?.fulfillment === 'matriz').length;
  const openFull = openOrders.filter(order => order.operacao?.fulfillment === 'full').length;

  const handlePeriodChange = (days: number) => {
    setSelectedPeriod(days);
    setCurrentPage(1);
    setLoading(true);
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
              onClick={() => { setLoading(true); fetchOrders(selectedPeriod, true); }}
              disabled={syncing}
              className="button-secondary px-3 text-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <NotificationsButton />
            <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-[#26322c] text-[11px] font-semibold text-white">
              AD
            </div>
          </div>
        </header>

        <div className="app-content space-y-6">

          <div>
            <p className="page-kicker mb-3">Vendas</p>
            <h2 className="page-title">Pedidos</h2>
            <p className="page-description mt-2">Acompanhe cada pedido pela loja, marketplace e depósito vinculados no Bling.</p>
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

                {/* Operação */}
                <div className="surface flex flex-wrap items-center gap-1 p-1">
                  <Warehouse className="ml-2 h-4 w-4 text-gray-500" />
                  {OPERATION_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedOperation(option.value)}
                      className={`rounded-[4px] px-3 py-1.5 text-xs font-medium ${
                        selectedOperation === option.value
                          ? 'bg-[#26322c] text-white'
                          : 'text-[#666a63] hover:bg-[#ecece5] hover:text-[#20221f]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {/* Marketplace */}
                <div className="surface flex flex-wrap items-center gap-1 p-1">
                  <Store className="ml-2 h-4 w-4 text-gray-500" />
                  {MARKETPLACE_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedMarketplace(option.value)}
                      className={`rounded-[4px] px-3 py-1.5 text-xs font-medium ${
                        selectedMarketplace === option.value
                          ? 'bg-[#26322c] text-white'
                          : 'text-[#666a63] hover:bg-[#ecece5] hover:text-[#20221f]'
                      }`}
                    >
                      {option.label}
                      {option.value !== 'todos' && ` (${orders.filter(order => marketplaceKey(order.operacao?.marketplace) === option.value).length})`}
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
                    placeholder="Buscar pedido, cliente, loja ou depósito..."
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
                  <p className="mb-1 text-xs text-[#737770]">Em aberto · Matriz</p>
                  <p className="data-number text-2xl font-semibold text-[#66b89d]">{openMatriz}</p>
                  <p className="mt-1 text-xs text-[#858981]">separação própria</p>
                </div>
                <div className="metric-cell">
                  <p className="mb-1 text-xs text-[#737770]">Em aberto · Full</p>
                  <p className="data-number text-2xl font-semibold text-[#77afc2]">{openFull}</p>
                  <p className="mt-1 text-xs text-[#858981]">logística Mercado Livre</p>
                </div>
              </div>

              {/* Tabela */}
              <div className="data-table overflow-x-auto">
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
                    <div className="hidden min-w-[1180px] grid-cols-[80px_minmax(160px,1fr)_minmax(210px,1.35fr)_140px_120px_135px_110px_90px_40px] gap-4 border-b border-[#dedfd8] bg-[#f4f4ef] px-6 py-3 text-[11px] font-semibold text-[#737770] lg:grid">
                      <span>Pedido</span>
                      <span>Cliente</span>
                      <span>Loja e depósito</span>
                      <span>Venda / entrega</span>
                      <span>Tipo de envio</span>
                      <span>Status</span>
                      <span className="text-right">Total</span>
                      <span></span>
                    </div>

                    <div className="divide-y divide-[#e3e4dd]">
                      {paginatedOrders.map((order, i) => {
                        const sit = getSituacaoStyle(order.situacao?.id);
                        const operationStyle = getOperationStyle(order.operacao?.fulfillment);
                        const marketplaceStyle = getMarketplaceStyle(order.operacao?.marketplace);
                        const shippingStyle = getShippingStyle(order.operacao?.shippingMethod, order.detailsLoaded);
                        const itemDescriptions = (order.itens || [])
                          .map(item => item.descricao?.trim())
                          .filter((description): description is string => Boolean(description));
                        return (
                          <div
                            key={order.id}
                            className="data-table-row grid grid-cols-1 items-start gap-4 px-5 py-5 lg:min-w-[1180px] lg:grid-cols-[80px_minmax(160px,1fr)_minmax(210px,1.35fr)_140px_120px_135px_110px_90px_40px] lg:items-center lg:gap-4 lg:px-6 lg:py-4"
                          >
                            {/* Número */}
                            <div>
                              <span className="font-mono text-sm font-semibold text-[#176b57]">#{order.numero}</span>
                              {order.numeroLoja && (
                                <p className="mt-1 truncate text-[11px] text-gray-600" title={order.numeroLoja}>{order.numeroLoja}</p>
                              )}
                              <p className="mt-1 text-[10px] text-[#667069] lg:hidden">Item {(currentPage - 1) * PAGE_SIZE + i + 1}</p>
                            </div>

                            {/* Cliente */}
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-[#31342f]">
                                {order.contato?.nome || 'Cliente não informado'}
                              </p>
                              {!order.detailsLoaded ? (
                                <p className="mt-1 text-xs text-[#737d75]">Carregando produtos...</p>
                              ) : order.itens && order.itens.length > 0 ? (
                                <p className="mt-1 truncate text-xs text-[#858981]" title={itemDescriptions.join(' · ')}>
                                  {order.itens.length} {order.itens.length === 1 ? 'item' : 'itens'}
                                  {itemDescriptions[0] ? ` · ${itemDescriptions[0]}` : ''}
                                  {itemDescriptions.length > 1 ? ` +${itemDescriptions.length - 1}` : ''}
                                </p>
                              ) : (
                                <p className="mt-1 text-xs text-[#737d75]">Produtos não informados pelo Bling</p>
                              )}
                            </div>

                            {/* Loja, marketplace e depósito */}
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`inline-flex rounded-[4px] border px-2 py-0.5 text-[10px] font-bold ${marketplaceStyle.className}`}>
                                  {marketplaceStyle.label}
                                </span>
                                <span className={`inline-flex rounded-[4px] border px-2 py-0.5 text-[10px] font-bold ${operationStyle.className}`}>
                                  {operationStyle.label}
                                </span>
                                <span className="truncate text-sm font-medium" title={order.operacao?.storeName}>
                                  {order.operacao?.storeName || 'Loja não identificada'}
                                </span>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#858981]">
                                <span className="flex min-w-0 items-center gap-1.5">
                                  <Store className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">{order.operacao?.businessUnitName || 'Unidade não identificada'}</span>
                                </span>
                                <span className="flex min-w-0 items-center gap-1.5">
                                  <Warehouse className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">{order.operacao?.warehouseName || 'Depósito não identificado'}</span>
                                </span>
                              </div>
                            </div>

                            {/* Datas */}
                            <div className="space-y-1.5 text-xs">
                              <div className="flex items-center gap-2 text-[#a1a8a0]">
                                <Calendar className="h-3.5 w-3.5 shrink-0 text-[#737d75]" />
                                <span><span className="text-[#737d75]">Venda</span> {formatDate(order.data)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[#a1a8a0]">
                                <Truck className="h-3.5 w-3.5 shrink-0 text-[#737d75]" />
                                <span><span className="text-[#737d75]">Entrega</span> {formatDate(order.dataPrevista || order.dataSaida || '')}</span>
                              </div>
                            </div>

                            {/* Tipo de envio */}
                            <div>
                              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#737d75] lg:hidden">Tipo de envio</p>
                              <span
                                className={`inline-flex rounded-[4px] border px-2 py-1 text-[10px] font-bold ${shippingStyle.className}`}
                                title={order.operacao?.shippingService || shippingStyle.label}
                              >
                                {shippingStyle.label}
                              </span>
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
