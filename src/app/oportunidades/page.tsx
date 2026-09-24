"use client";

import React, { useState } from 'react';
import { 
  Bell, 
  Activity, TrendingUp, AlertTriangle, Lightbulb,
  ExternalLink, Truck, Search, Clock, X, History
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';

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

const HISTORY_KEY = 'vortex_oportunidades_history';
const MAX_HISTORY = 8;

function loadHistory(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveToHistory(term: string) {
  if (typeof window === 'undefined') return;
  const history = loadHistory().filter(h => h !== term);
  history.unshift(term);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}

export default function Oportunidades() {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'report' | 'data'>('report');
  const [history, setHistory] = useState<string[]>(() => loadHistory());
  const [showHistory, setShowHistory] = useState(false);

  const handleSearch = async (term: string) => {
    const q = term.trim();
    if (!q) return;

    setSearchTerm(q);
    setShowHistory(false);
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`/api/opportunities?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.success) {
        setResult(data);
        setActiveTab('report');
        saveToHistory(q);
        setHistory(loadHistory());
      } else {
        setError(data.error || 'Erro ao analisar oportunidades');
      }
    } catch {
      setError('Falha ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchTerm);
  };

  const removeFromHistory = (term: string) => {
    const updated = history.filter(h => h !== term);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    setHistory(updated);
  };

  const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
    setShowHistory(false);
  };

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="app-main">
        {/* Topbar */}
        <header className="app-topbar">
          <div className="flex items-center gap-3">
            <Activity className="h-[18px] w-[18px] text-[#176b57]" />
            <h2 className="text-sm font-semibold">Pesquisa de mercado</h2>
          </div>
          <div className="flex items-center gap-4">
            <button className="icon-button" aria-label="Notificações">
              <Bell className="h-[18px] w-[18px]" />
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-[#26322c] text-[11px] font-semibold text-white">
              AD
            </div>
          </div>
        </header>

        <div className="app-content space-y-7">
          {/* Título e Busca */}
          <div className="max-w-4xl">
            <p className="page-kicker mb-3">Mercado Livre</p>
            <h1 className="page-title">Radar de oportunidades</h1>
            <p className="page-description mb-7 mt-2">
              Pesquise um produto para comparar preços, concorrentes e sinais de demanda no Mercado Livre.
            </p>

            {/* Campo de busca com histórico */}
            <div className="relative">
              <form onSubmit={handleSubmit}>
                <div className="surface flex items-center px-4 py-3 focus-within:border-[#176b57]">
                  <Search className="h-[18px] w-[18px] shrink-0 text-[#7b7f78]" />
                  <input 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => history.length > 0 && setShowHistory(true)}
                    onBlur={() => setTimeout(() => setShowHistory(false), 150)}
                    placeholder="Ex: bolsa feminina couro legítimo, cinto corrente dourado..."
                    className="ml-3 w-full border-none bg-transparent text-base text-[#20221f] outline-none placeholder:text-[#9a9d97]"
                    disabled={loading}
                  />
                  {history.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowHistory(v => !v)}
                      className="icon-button mr-1 shrink-0"
                      title="Histórico de buscas"
                    >
                      <History className="w-4 h-4" />
                    </button>
                  )}
                  <button 
                    type="submit" 
                    disabled={loading || !searchTerm.trim()}
                    className="button-primary ml-1 shrink-0 px-5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {loading ? 'Analisando...' : 'Pesquisar'}
                  </button>
                </div>
              </form>

              {/* Dropdown do histórico */}
              {showHistory && history.length > 0 && (
                <div className="surface absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden shadow-[0_16px_40px_rgba(30,36,32,0.14)]">
                  <div className="flex items-center justify-between border-b border-[#dedfd8] px-4 py-2.5">
                    <span className="flex items-center gap-2 text-xs font-medium text-[#737770]">
                      <Clock className="w-3.5 h-3.5" /> Buscas recentes
                    </span>
                    <button
                      onClick={clearHistory}
                      className="text-xs text-[#858981] hover:text-[#9b3b2d]"
                    >
                      Limpar tudo
                    </button>
                  </div>
                  {history.map((term, i) => (
                    <div
                      key={i}
                      className="group flex items-center justify-between px-4 py-2.5 hover:bg-[#f2f2ed]"
                    >
                      <button
                        className="flex flex-1 items-center gap-3 text-left text-sm text-[#4d514b] hover:text-[#20221f]"
                        onClick={() => handleSearch(term)}
                      >
                        <Search className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                        {term}
                      </button>
                      <button
                        onClick={() => removeFromHistory(term)}
                        className="rounded-[3px] p-1 text-[#92958f] opacity-0 hover:bg-[#e6e6df] hover:text-[#9b3b2d] group-hover:opacity-100"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chips de sugestão rápida */}
            {!result && !loading && (
              <div className="mt-4 flex flex-wrap gap-2">
                {['bolsa clutch festa', 'cinto couro fivela', 'fone bluetooth', 'mochila masculina'].map(s => (
                  <button
                    key={s}
                    onClick={() => handleSearch(s)}
                    className="rounded-[4px] border border-[#d7d8d0] bg-[#fbfbf8] px-3 py-1.5 text-xs text-[#666a63] hover:border-[#91b7a8] hover:text-[#176b57]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 space-y-6">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#b9c9c2] border-t-[#176b57]"></div>
              <div className="text-center">
                <p className="text-base font-medium text-[#31433c]">Analisando &quot;{searchTerm}&quot;...</p>
                <p className="mt-2 text-sm text-[#777b74]">Consultando preços e anúncios do Mercado Livre. Isso pode levar alguns segundos.</p>
              </div>
            </div>
          )}

          {/* Erro */}
          {error && !loading && (
            <div className="flex items-start gap-4 rounded-[6px] border border-[#d9aaa0] bg-[#f7e7e3] p-6 text-[#8a3326]">
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
              <div className="surface flex items-center justify-between p-5">
                <div>
                  <span className="text-sm text-[#737770]">Resultados para</span>
                  <h2 className="text-xl font-semibold text-[#20221f]">&quot;{result.query}&quot;</h2>
                </div>
                <span className="rounded-[4px] bg-[#ecece5] px-4 py-2 text-sm text-[#666a63]">{result.totalResults}</span>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 border-b border-[#d7d8d0]">
                <button onClick={() => setActiveTab('report')} className={`border-b-2 px-4 py-2.5 text-sm font-medium ${activeTab === 'report' ? 'border-[#176b57] text-[#176b57]' : 'border-transparent text-[#737770] hover:text-[#20221f]'}`}>
                  Análise
                </button>
                <button onClick={() => setActiveTab('data')} className={`border-b-2 px-4 py-2.5 text-sm font-medium ${activeTab === 'data' ? 'border-[#176b57] text-[#176b57]' : 'border-transparent text-[#737770] hover:text-[#20221f]'}`}>
                  Anúncios encontrados ({result.products.length})
                </button>
              </div>

              {/* TAB: Relatório IA */}
              {activeTab === 'report' && result.report && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Oportunidades */}
                  <div className="surface p-6">
                    <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-[#20221f]">
                      <Lightbulb className="h-5 w-5 text-[#a25714]" /> Oportunidades
                    </h2>
                    <div className="space-y-4">
                      {result.report.opportunities?.map((opp, i) => (
                        <div key={i} className="rounded-[5px] border border-[#d7d8d0] bg-[#f4f4ef] p-5">
                          <p className="text-sm leading-relaxed text-[#4d514b]">{opp}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Tendências */}
                    <div className="surface p-6">
                      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-[#20221f]">
                        <TrendingUp className="h-5 w-5 text-[#176b57]" /> Visão de mercado
                      </h2>
                      <ul className="space-y-3">
                        {result.report.trends?.map((trend, i) => (
                          <li key={i} className="flex gap-3 text-sm leading-relaxed text-[#5f635c]">
                            <span className="mt-0.5 text-[#176b57]">•</span> {trend}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Ameaças */}
                    <div className="rounded-[6px] border border-[#dfb8af] bg-[#f7e7e3] p-6">
                      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-[#8a3326]">
                        <AlertTriangle className="h-5 w-5" /> Pontos de atenção
                      </h2>
                      <ul className="space-y-3">
                        {result.report.threats?.map((threat, i) => (
                          <li key={i} className="flex gap-3 text-sm leading-relaxed text-[#694b45]">
                            <span className="mt-0.5 text-lg leading-none text-[#a44435]">!</span> {threat}
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
                    <div key={i} className="surface data-table-row flex items-center justify-between gap-4 p-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <span className="text-xs text-gray-600 font-mono w-5 shrink-0">#{i + 1}</span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[#31342f]">{p.title}</p>
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
                        <span className="data-number text-lg font-semibold">{p.price}</span>
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
              <p className="text-sm mt-2">Exemplos: &quot;bolsa clutch festa&quot;, &quot;cinto couro fivela dourada&quot;, &quot;fone bluetooth&quot;</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
