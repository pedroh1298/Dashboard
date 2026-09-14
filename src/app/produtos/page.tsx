"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
  'A': { label: 'Ativo',    color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  'I': { label: 'Inativo',  color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30',        icon: <XCircle className="w-3.5 h-3.5" /> },
  'E': { label: 'Excluído', color: 'text-gray-500',    bg: 'bg-gray-500/10 border-gray-500/30',      icon: <XCircle className="w-3.5 h-3.5" /> },
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
    <div className="flex h-screen bg-[#0a0a0c] text-white font-sans overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-y-auto relative">
        {/* Topbar */}
        <header className="h-20 border-b border-white/10 flex items-center justify-between px-8 bg-[#121215]/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-indigo-400" />
            <h1 className="font-bold text-lg">Catálogo de Produtos</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setLoading(true); fetchProducts(); }}
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

          {loading && (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
              <p className="text-gray-400 text-sm animate-pulse">Sincronizando produtos do Bling ERP...</p>
            </div>
          )}

          {!loading && !connectedBling && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-8 flex flex-col items-center text-center gap-4">
              <AlertCircle className="w-10 h-10 text-amber-400" />
              <div>
                <h3 className="font-bold text-lg text-amber-300">Bling ERP não conectado</h3>
                <p className="text-gray-400 text-sm mt-1">Conecte sua conta do Bling no Dashboard para visualizar o catálogo.</p>
              </div>
              <a href="/" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-all">
                Ir para o Dashboard
              </a>
            </div>
          )}

          {!loading && connectedBling && (
            <>
              {/* Cards de resumo */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#121215] border border-white/10 rounded-xl p-4 relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-2xl -mr-4 -mt-4 group-hover:bg-indigo-500/10 transition-colors" />
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart2 className="w-4 h-4 text-indigo-400" />
                    <p className="text-xs text-gray-400">Total de Produtos</p>
                  </div>
                  <p className="text-2xl font-bold">{products.length}</p>
                  <p className="text-xs text-gray-500 mt-1">{ativos} ativos</p>
                </div>

                <div className="bg-[#121215] border border-white/10 rounded-xl p-4 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-2xl -mr-4 -mt-4 group-hover:bg-emerald-500/10 transition-colors" />
                  <div className="flex items-center gap-2 mb-2">
                    <Boxes className="w-4 h-4 text-emerald-400" />
                    <p className="text-xs text-gray-400">Estoque Total</p>
                  </div>
                  <p className="text-2xl font-bold text-emerald-400">{estoqueTotal.toFixed(0)}</p>
                  <p className="text-xs text-gray-500 mt-1">unidades</p>
                </div>

                <div className="bg-[#121215] border border-white/10 rounded-xl p-4 relative overflow-hidden group hover:border-red-500/30 transition-colors">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 rounded-full blur-2xl -mr-4 -mt-4 group-hover:bg-red-500/10 transition-colors" />
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-red-400" />
                    <p className="text-xs text-gray-400">Sem Estoque</p>
                  </div>
                  <p className="text-2xl font-bold text-red-400">{semEstoque}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {products.length > 0 ? `${((semEstoque / products.length) * 100).toFixed(0)}% do catálogo` : '-'}
                  </p>
                </div>

                <div className="bg-[#121215] border border-white/10 rounded-xl p-4 relative overflow-hidden group hover:border-orange-500/30 transition-colors">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/5 rounded-full blur-2xl -mr-4 -mt-4 group-hover:bg-orange-500/10 transition-colors" />
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-orange-400" />
                    <p className="text-xs text-gray-400">Preço Médio</p>
                  </div>
                  <p className="text-xl font-bold text-orange-400">{formatCurrency(valorMedio)}</p>
                  <p className="text-xs text-gray-500 mt-1">por produto</p>
                </div>
              </div>

              {/* Filtros */}
              <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
                {/* Estoque */}
                <div className="flex items-center gap-2 bg-[#121215] border border-white/10 rounded-xl p-1">
                  <Boxes className="w-4 h-4 text-gray-500 ml-2" />
                  {STOCK_FILTERS.map(f => (
                    <button
                      key={f.value}
                      onClick={() => setStockFilter(f.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        stockFilter === f.value
                          ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Situação */}
                <div className="flex items-center gap-2 bg-[#121215] border border-white/10 rounded-xl p-1">
                  <Filter className="w-4 h-4 text-gray-500 ml-2" />
                  <button
                    onClick={() => setSituacaoFilter(null)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      situacaoFilter === null ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Todos
                  </button>
                  {Object.entries(SITUACAO_STYLES).map(([key, s]) => (
                    <button
                      key={key}
                      onClick={() => setSituacaoFilter(key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        situacaoFilter === key ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'
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
                    placeholder="Buscar por nome ou código..."
                    className="bg-transparent border-none outline-none text-sm text-white placeholder-gray-600 w-full"
                  />
                </div>
              </div>

              {/* Tabela de produtos */}
              <div className="bg-[#121215] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
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
                    <div className="hidden md:grid grid-cols-[50px_100px_1fr_100px_120px_110px] gap-4 px-6 py-3 border-b border-white/5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <span>#</span>
                      <span>Código</span>
                      <span>Produto</span>
                      <span className="text-center">Estoque</span>
                      <span>Situação</span>
                      <span className="text-right">Preço</span>
                    </div>

                    <div className="divide-y divide-white/5">
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
                            className="grid grid-cols-1 md:grid-cols-[50px_100px_1fr_100px_120px_110px] gap-2 md:gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors items-center"
                          >
                            <span className="hidden md:block text-xs text-gray-600 font-mono">
                              {(currentPage - 1) * PAGE_SIZE + i + 1}
                            </span>

                            <span className="font-mono text-xs text-gray-500 truncate">
                              {product.codigo || '—'}
                            </span>

                            <div className="min-w-0">
                              <p className="text-sm text-gray-200 font-medium truncate">{product.nome}</p>
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
                              <span className="text-base font-bold text-white">
                                {formatCurrency(product.preco || 0)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Paginação */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
                        <p className="text-xs text-gray-500">
                          Mostrando {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredProducts.length)} de {filteredProducts.length} produtos
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
