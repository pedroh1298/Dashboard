"use client";

import React, { useState } from 'react';
import { 
  BarChart3, Package, ShoppingCart, Settings, Bell, 
  Activity, LogOut, Sparkles, TrendingUp, AlertTriangle, Lightbulb,
  ExternalLink, Truck, Search
} from 'lucide-react';
import Link from 'next/link';

interface ScrapedProduct {
  title: string;
  price: string;
  link: string;
  seller: string;
  freeShipping: boolean;
}

interface Report {
  trends: string[];
  opportunities: string[];
  threats: string[];
}

interface ResultData {
  query: string;
  totalResults: string;
  products: ScrapedProduct[];
  report: Report;
}

export default function Oportunidades() {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'report' | 'data'>('report');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`/api/opportunities?q=${encodeURIComponent(searchTerm)}`);
      const data = await res.json();
      if (data.success) {
        setResult(data);
        setActiveTab('report');
      } else {
        setError(data.error || 'Erro ao analisar oportunidades');
      }
    } catch {
      setError('Falha ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
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
          <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <BarChart3 className="w-5 h-5" /> Dashboard
          </Link>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <Package className="w-5 h-5" /> Produtos
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <ShoppingCart className="w-5 h-5" /> Pedidos
          </a>
          <Link href="/oportunidades" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 font-medium">
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

      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Topbar */}
        <header className="h-20 border-b border-white/10 flex items-center justify-between px-8 bg-[#121215]/80 backdrop-blur-md sticky top-0 z-10">
          <div><h2 className="font-bold text-lg">Inteligência de Mercado</h2></div>
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
          {/* Título e Busca */}
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
              <Activity className="text-indigo-500" />
              Radar de Oportunidades
            </h1>
            <p className="text-gray-400 mt-2 mb-8">
              Digite o nome de um produto e a IA vai analisar preços, concorrência e oportunidades em tempo real no Mercado Livre.
            </p>

            <form onSubmit={handleSearch} className="relative">
              <div className="flex items-center bg-[#121215] border-2 border-white/10 rounded-2xl px-5 py-4 focus-within:border-indigo-500 transition-colors shadow-xl">
                <Search className="w-5 h-5 text-gray-500 shrink-0" />
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ex: bolsa feminina couro legítimo, cinto corrente dourado..."
                  className="bg-transparent border-none outline-none ml-3 text-white placeholder-gray-600 w-full text-lg"
                  disabled={loading}
                />
                <button 
                  type="submit" 
                  disabled={loading || !searchTerm.trim()}
                  className="ml-3 px-6 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all text-sm shrink-0"
                >
                  {loading ? 'Analisando...' : 'Pesquisar'}
                </button>
              </div>
            </form>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 space-y-6">
              <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
              <div className="text-center">
                <p className="text-indigo-400 animate-pulse font-medium text-lg">Analisando "{searchTerm}"...</p>
                <p className="text-gray-500 text-sm mt-2">Raspando preços do Mercado Livre e consultando a IA. Aguarde até 30s.</p>
              </div>
            </div>
          )}

          {/* Erro */}
          {error && !loading && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-red-400 flex items-start gap-4">
              <AlertTriangle className="w-8 h-8 shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-1">Falha na análise</h3>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Resultados */}
          {result && !loading && (
            <div className="space-y-6">
              {/* Header do resultado */}
              <div className="bg-[#121215] border border-white/10 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-400">Resultados para</span>
                  <h2 className="text-xl font-bold text-white">"{result.query}"</h2>
                </div>
                <span className="text-sm text-gray-500 bg-white/5 px-4 py-2 rounded-lg">{result.totalResults}</span>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 border-b border-white/10 pb-1">
                <button onClick={() => setActiveTab('report')} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'report' ? 'bg-indigo-500/20 text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-400 hover:text-white'}`}>
                  📊 Análise da IA
                </button>
                <button onClick={() => setActiveTab('data')} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'data' ? 'bg-indigo-500/20 text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-400 hover:text-white'}`}>
                  🔍 Anúncios Encontrados ({result.products.length})
                </button>
              </div>

              {/* TAB: Relatório IA */}
              {activeTab === 'report' && result.report && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Oportunidades */}
                  <div className="bg-gradient-to-br from-[#121215] to-[#1a1a24] border border-indigo-500/20 rounded-2xl p-6 shadow-xl">
                    <h2 className="text-xl font-bold text-indigo-400 mb-6 flex items-center gap-2">
                      <Lightbulb className="w-6 h-6 text-yellow-400" /> Oportunidades
                    </h2>
                    <div className="space-y-4">
                      {result.report.opportunities?.map((opp, i) => (
                        <div key={i} className="bg-indigo-500/10 border border-indigo-500/20 p-5 rounded-xl">
                          <p className="text-gray-200 text-sm leading-relaxed">{opp}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Tendências */}
                    <div className="bg-[#121215] border border-white/10 rounded-2xl p-6 shadow-xl">
                      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-400" /> Visão de Mercado
                      </h2>
                      <ul className="space-y-3">
                        {result.report.trends?.map((trend, i) => (
                          <li key={i} className="flex gap-3 text-sm text-gray-400 leading-relaxed">
                            <span className="text-green-500 mt-0.5">•</span> {trend}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Ameaças */}
                    <div className="bg-[#1c1212] border border-red-500/20 rounded-2xl p-6 shadow-xl">
                      <h2 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" /> Pontos de Atenção
                      </h2>
                      <ul className="space-y-3">
                        {result.report.threats?.map((threat, i) => (
                          <li key={i} className="flex gap-3 text-sm text-gray-400 leading-relaxed">
                            <span className="text-red-500 mt-0.5 text-lg leading-none">!</span> {threat}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: Dados Brutos */}
              {activeTab === 'data' && (
                <div className="space-y-3">
                  {result.products.map((p, i) => (
                    <div key={i} className="bg-[#121215] border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-indigo-500/30 transition-colors">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <span className="text-xs text-gray-600 font-mono w-5 shrink-0">#{i + 1}</span>
                        <div className="min-w-0">
                          <p className="text-sm text-gray-200 font-medium truncate">{p.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500">{p.seller}</span>
                            {p.freeShipping && (
                              <span className="flex items-center gap-1 text-xs text-green-400">
                                <Truck className="w-3 h-3" /> Frete Grátis
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-lg font-bold text-white">{p.price}</span>
                        {p.link && (
                          <a href={p.link} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Ver no Mercado Livre">
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Estado vazio */}
          {!loading && !result && !error && (
            <div className="text-center py-16 text-gray-600">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg">Digite um produto acima para começar a análise.</p>
              <p className="text-sm mt-2">Exemplos: "bolsa clutch festa", "cinto couro fivela dourada", "fone bluetooth"</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
