"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Package,
  Bell,
  Search,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Tag,
  Boxes,
  TrendingDown,
  Loader2,
  BarChart2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';

interface BlingProduct {
  id: number;
  nome: string;
  codigo: string;
  preco: number;
  tipo?: string;
  situacao?: string;
  formato?: string;
  estoque?: {
    saldoFisicoTotal?: number;
    saldoVirtualTotal?: number;
  };
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

const SITUACAO_STYLES: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  'A': { label: 'Ativo',    color: 'text-[#176b57]', bg: 'bg-[#e5f1ec] border-[#b9d5ca]', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  'I': { label: 'Inativo',  color: 'text-[#9b3b2d]', bg: 'bg-[#f7e7e3] border-[#dfb8af]', icon: <XCircle className="w-3.5 h-3.5" /> },
  'E': { label: 'Excluído', color: 'text-[#666a63]', bg: 'bg-[#ecece5] border-[#d5d6ce]', icon: <XCircle className="w-3.5 h-3.5" /> },
};

const STOCK_FILTERS = [
  { label: 'Todos',          value: 'all' },
  { label: 'Em estoque',     value: 'in_stock' },
  { label: 'Estoque baixo',  value: 'low_stock' },
  { label: 'Sem estoque',    value: 'no_stock' },
];

const PAGE_SIZE = 15;

export default function ProdutosPage() {
  const [products, setProducts] = useState<BlingProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<BlingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [situacaoFilter, setSituacaoFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [connectedBling, setConnectedBling] = useState(true);

  const fetchProducts = useCallback(async () => {
    setSyncing(true);
    setError('');
    try {
      const res = await fetch('/api/produtos');
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
        setConnectedBling(true);
      } else {
        setError(data.error || 'Erro ao buscar produtos');
        setConnectedBling(false);
      }
    } catch {
      setError('Falha ao conectar com o servidor.');
      setConnectedBling(false);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Filtros client-side
  useEffect(() => {
    let result = [...products];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.nome?.toLowerCase().includes(q) ||
        p.codigo?.toLowerCase().includes(q)
      );
    }

    if (situacaoFilter !== null) {
      result = result.filter(p => p.situacao === situacaoFilter);
    }

    if (stockFilter === 'in_stock') {
      result = result.filter(p => (p.estoque?.saldoFisicoTotal ?? 0) > 5);
    } else if (stockFilter === 'low_stock') {
      result = result.filter(p => {
        const s = p.estoque?.saldoFisicoTotal ?? 0;
        return s > 0 && s <= 5;
      });
    } else if (stockFilter === 'no_stock') {
      result = result.filter(p => (p.estoque?.saldoFisicoTotal ?? 0) <= 0);
    }

    setFilteredProducts(result);
    setCurrentPage(1);
  }, [products, search, stockFilter, situacaoFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const ativos = products.filter(p => p.situacao === 'A').length;
  const semEstoque = products.filter(p => (p.estoque?.saldoFisicoTotal ?? 0) <= 0).length;
  const estoqueTotal = products.reduce((s, p) => s + (p.estoque?.saldoFisicoTotal ?? 0), 0);
  const valorMedio = products.length > 0
    ? products.reduce((s, p) => s + (p.preco || 0), 0) / products.length
    : 0;

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="app-main">
        {/* Topbar */}
        <header className="app-topbar">
          <div className="flex items-center gap-3">
            <Package className="h-[18px] w-[18px] text-[#176b57]" />
            <h1 className="text-sm font-semibold">Catálogo de produtos</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setLoading(true); fetchProducts(); }}
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
            <p className="page-kicker mb-3">Inventário</p>
            <h2 className="page-title">Produtos</h2>
            <p className="page-description mt-2">Consulte preços, disponibilidade e situação do catálogo sincronizado com o Bling.</p>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-[#176b57]" />
              <p className="text-sm text-[#6f736d]">Sincronizando produtos do Bling ERP...</p>
            </div>
          )}

          {!loading && !connectedBling && (
            <div className="surface flex flex-col items-center gap-4 p-8 text-center">
              <AlertCircle className="h-9 w-9 text-[#a25714]" />
              <div>
                <h3 className="text-lg font-semibold text-[#20221f]">Bling ERP não conectado</h3>
                <p className="mt-1 text-sm text-[#6f736d]">Conecte sua conta do Bling no painel para visualizar o catálogo.</p>
              </div>
              <Link href="/" className="button-primary px-5 text-sm">
                Ir para o Dashboard
              </Link>
            </div>
          )}

          {!loading && connectedBling && (
            <>
              {/* Cards de resumo */}
              <div className="metric-strip grid-cols-2 lg:grid-cols-4">
                <div className="metric-cell">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart2 className="h-4 w-4 text-[#176b57]" />
                    <p className="text-xs text-[#737770]">Total de produtos</p>
                  </div>
                  <p className="data-number text-2xl font-semibold">{products.length}</p>
                  <p className="mt-1 text-xs text-[#858981]">{ativos} ativos</p>
                </div>

                <div className="metric-cell">
                  <div className="flex items-center gap-2 mb-2">
                    <Boxes className="h-4 w-4 text-[#176b57]" />
                    <p className="text-xs text-[#737770]">Estoque total</p>
                  </div>
                  <p className="data-number text-2xl font-semibold text-[#176b57]">{estoqueTotal.toFixed(0)}</p>
                  <p className="mt-1 text-xs text-[#858981]">unidades</p>
                </div>

                <div className="metric-cell">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-4 w-4 text-[#a44435]" />
                    <p className="text-xs text-[#737770]">Sem estoque</p>
                  </div>
                  <p className="data-number text-2xl font-semibold text-[#a44435]">{semEstoque}</p>
                  <p className="mt-1 text-xs text-[#858981]">
                    {products.length > 0 ? `${((semEstoque / products.length) * 100).toFixed(0)}% do catálogo` : '-'}
                  </p>
                </div>

                <div className="metric-cell">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="h-4 w-4 text-[#a25714]" />
                    <p className="text-xs text-[#737770]">Preço médio</p>
                  </div>
                  <p className="data-number text-xl font-semibold text-[#8a4c15]">{formatCurrency(valorMedio)}</p>
                  <p className="mt-1 text-xs text-[#858981]">por produto</p>
                </div>
              </div>

              {/* Filtros */}
              <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
                {/* Estoque */}
                <div className="surface flex items-center gap-1 p-1">
                  <Boxes className="w-4 h-4 text-gray-500 ml-2" />
                  {STOCK_FILTERS.map(f => (
                    <button
                      key={f.value}
                      onClick={() => setStockFilter(f.value)}
                      className={`rounded-[4px] px-3 py-1.5 text-xs font-medium ${
                        stockFilter === f.value
                          ? 'bg-[#26322c] text-white'
                          : 'text-[#666a63] hover:bg-[#ecece5] hover:text-[#20221f]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Situação */}
                <div className="surface flex items-center gap-1 p-1">
                  <Filter className="w-4 h-4 text-gray-500 ml-2" />
                  <button
                    onClick={() => setSituacaoFilter(null)}
                    className={`rounded-[4px] px-3 py-1.5 text-xs font-medium ${
                      situacaoFilter === null ? 'bg-[#26322c] text-white' : 'text-[#666a63] hover:bg-[#ecece5] hover:text-[#20221f]'
                    }`}
                  >
                    Todos
                  </button>
                  {Object.entries(SITUACAO_STYLES).map(([key, s]) => (
                    <button
                      key={key}
                      onClick={() => setSituacaoFilter(key)}
                      className={`rounded-[4px] px-3 py-1.5 text-xs font-medium ${
                        situacaoFilter === key ? 'bg-[#26322c] text-white' : 'text-[#666a63] hover:bg-[#ecece5] hover:text-[#20221f]'
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
                    placeholder="Buscar por nome ou código..."
                    className="w-full border-none bg-transparent text-sm outline-none placeholder:text-[#9a9d97]"
                  />
                </div>
              </div>

              {/* Tabela de produtos */}
              <div className="data-table">
                {error && (
                  <div className="p-4 bg-red-500/10 border-b border-red-500/20 flex items-center gap-3 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                {filteredProducts.length === 0 && !error ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-500 text-center px-4">
                    <Package className="w-12 h-12 mb-4 opacity-30" />
                    <p className="text-base font-medium text-gray-400">Nenhum produto encontrado</p>
                    <p className="text-sm mt-1">Tente ajustar os filtros ou a busca.</p>
                  </div>
                ) : (
                  <>
                    {/* Header */}
                    <div className="hidden grid-cols-[50px_100px_1fr_100px_120px_110px] gap-4 border-b border-[#dedfd8] bg-[#f4f4ef] px-6 py-3 text-[11px] font-semibold text-[#737770] md:grid">
                      <span>#</span>
                      <span>Código</span>
                      <span>Produto</span>
                      <span className="text-center">Estoque</span>
                      <span>Situação</span>
                      <span className="text-right">Preço</span>
                    </div>

                    <div className="divide-y divide-[#e3e4dd]">
                      {paginatedProducts.map((product, i) => {
                        const sit = SITUACAO_STYLES[product.situacao || 'A'] || SITUACAO_STYLES['A'];
                        const estoque = product.estoque?.saldoFisicoTotal ?? null;
                        const estoqueColor = estoque === null
                          ? 'text-gray-500'
                          : estoque <= 0
                          ? 'text-red-400'
                          : estoque <= 5
                          ? 'text-yellow-400'
                          : 'text-emerald-400';

                        return (
                          <div
                            key={product.id}
                            className="data-table-row grid grid-cols-1 items-center gap-2 px-6 py-4 md:grid-cols-[50px_100px_1fr_100px_120px_110px] md:gap-4"
                          >
                            <span className="hidden md:block text-xs text-gray-600 font-mono">
                              {(currentPage - 1) * PAGE_SIZE + i + 1}
                            </span>

                            <span className="font-mono text-xs text-gray-500 truncate">
                              {product.codigo || '—'}
                            </span>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-[#31342f]">{product.nome}</p>
                              {product.tipo && (
                                <p className="text-xs text-gray-600 mt-0.5">{product.tipo}</p>
                              )}
                            </div>

                            <div className="text-center">
                              <span className={`text-sm font-bold ${estoqueColor}`}>
                                {estoque !== null ? estoque.toFixed(0) : '—'}
                              </span>
                              <p className="text-xs text-gray-600 mt-0.5">un.</p>
                            </div>

                            <div>
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${sit.bg} ${sit.color}`}>
                                {sit.icon}
                                {sit.label}
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="data-number text-base font-semibold">
                                {formatCurrency(product.preco || 0)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Paginação */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between border-t border-[#dedfd8] px-6 py-4">
                        <p className="text-xs text-gray-500">
                          Mostrando {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredProducts.length)} de {filteredProducts.length} produtos
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
