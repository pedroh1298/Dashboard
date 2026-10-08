"use client";

import Image from 'next/image';
import React, { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  Clipboard,
  ImagePlus,
  Loader2,
  RefreshCw,
  Sparkles,
  Tag,
  Trash2,
  WandSparkles,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import NotificationsButton from '@/components/NotificationsButton';
import type { CompleteListingResponse, ListingMarketplace, ListingTone, ProductCondition } from '@/services/ai';

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const marketplaceOptions: Array<{ value: ListingMarketplace; label: string }> = [
  { value: 'mercado_livre', label: 'Mercado Livre' },
  { value: 'amazon', label: 'Amazon' },
  { value: 'ambos', label: 'Ambos' },
];

const toneOptions: Array<{ value: ListingTone; label: string }> = [
  { value: 'direto', label: 'Direto' },
  { value: 'premium', label: 'Premium' },
  { value: 'tecnico', label: 'Técnico' },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function GeradorAnuncios() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [productName, setProductName] = useState('');
  const [features, setFeatures] = useState('');
  const [category, setCategory] = useState('');
  const [audience, setAudience] = useState('');
  const [referencePrice, setReferencePrice] = useState('');
  const [marketplace, setMarketplace] = useState<ListingMarketplace>('mercado_livre');
  const [tone, setTone] = useState<ListingTone>('direto');
  const [condition, setCondition] = useState<ProductCondition>('novo');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [listing, setListing] = useState<CompleteListingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<'title' | 'description' | 'all' | null>(null);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview('');
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const selectImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError('');
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > MAX_IMAGE_BYTES) {
      setError('Envie uma imagem JPG, PNG ou WebP de até 4 MB.');
      event.target.value = '';
      return;
    }
    setImageFile(file);
  };

  const removeImage = () => {
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const generateListing = async (event: FormEvent) => {
    event.preventDefault();
    if (!productName.trim() && !imageFile) {
      setError('Informe o nome do produto ou envie uma foto.');
      return;
    }

    setLoading(true);
    setError('');
    setCopied(null);

    const body = new FormData();
    body.set('productName', productName);
    body.set('features', features);
    body.set('category', category);
    body.set('audience', audience);
    body.set('referencePrice', referencePrice);
    body.set('marketplace', marketplace);
    body.set('tone', tone);
    body.set('condition', condition);
    if (imageFile) body.set('image', imageFile);

    try {
      const response = await fetch('/api/listings/generate', { method: 'POST', body });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Não foi possível gerar o anúncio.');
      }
      setListing(data.listing);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Falha ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (type: 'title' | 'description' | 'all') => {
    if (!listing) return;
    const text = type === 'title'
      ? listing.title
      : type === 'description'
        ? listing.description
        : `${listing.title}\n\n${listing.description}\n\nPalavras-chave: ${listing.keywords.join(', ')}`;
    await navigator.clipboard.writeText(text);
    setCopied(type);
    window.setTimeout(() => setCopied(null), 1800);
  };

  const clearAll = () => {
    setProductName('');
    setFeatures('');
    setCategory('');
    setAudience('');
    setReferencePrice('');
    setMarketplace('mercado_livre');
    setTone('direto');
    setCondition('novo');
    setListing(null);
    setError('');
    removeImage();
  };

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="app-main">
        <header className="app-topbar">
          <div className="flex items-center gap-3">
            <WandSparkles className="h-[18px] w-[18px] text-[#176b57]" />
            <h1 className="text-sm font-semibold">Gerador de anúncios</h1>
          </div>
          <div className="flex items-center gap-4">
            <NotificationsButton />
            <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-[#26322c] text-[11px] font-semibold text-white">AD</div>
          </div>
        </header>

        <div className="app-content space-y-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="page-kicker mb-3">Inteligência artificial</p>
              <h2 className="page-title">Novo anúncio</h2>
              <p className="page-description mt-2">Prepare o conteúdo comercial e revise os dados antes da publicação.</p>
            </div>
            <button type="button" onClick={clearAll} className="button-secondary self-start px-4 text-sm sm:self-auto">
              <RefreshCw className="h-4 w-4" />
              Limpar
            </button>
          </div>

          <div className="grid items-start gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
            <form onSubmit={generateListing} className="surface overflow-hidden">
              <div className="border-b border-[#d7d8d0] px-5 py-4">
                <h3 className="text-sm font-semibold">Dados do produto</h3>
              </div>

              <div className="space-y-5 p-5">
                <div>
                  <span className="mb-2 block text-xs font-medium text-[#8a8e87]">Foto do produto</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={selectImage}
                    className="sr-only"
                  />
                  {imagePreview ? (
                    <div className="relative aspect-[4/3] overflow-hidden rounded-[5px] border border-[#d7d8d0] bg-[#121512]">
                      <Image src={imagePreview} alt="Produto selecionado" fill unoptimized className="object-contain" />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="icon-button absolute right-2 top-2 border border-white/15 bg-black/60 text-white hover:bg-black/80"
                        aria-label="Remover foto"
                        title="Remover foto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-[5px] border border-dashed border-[#566058] bg-[#121512] text-[#a1a8a0] hover:border-[#4aa185] hover:text-white"
                    >
                      <ImagePlus className="h-7 w-7" strokeWidth={1.5} />
                      <span className="text-sm font-medium">Selecionar foto</span>
                      <span className="text-xs text-[#737d75]">JPG, PNG ou WebP · até 4 MB</span>
                    </button>
                  )}
                </div>

                <label className="block">
                  <span className="mb-2 block text-xs font-medium text-[#8a8e87]">Nome do produto</span>
                  <input
                    value={productName}
                    onChange={event => setProductName(event.target.value)}
                    maxLength={140}
                    placeholder="Ex: Fone bluetooth com estojo"
                    className="field h-10 w-full px-3 text-sm outline-none placeholder:text-[#667069]"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-medium text-[#8a8e87]">Características conhecidas</span>
                  <textarea
                    value={features}
                    onChange={event => setFeatures(event.target.value)}
                    maxLength={1200}
                    rows={4}
                    placeholder="Material, cor, medidas, capacidade, itens inclusos..."
                    className="field w-full resize-y px-3 py-2.5 text-sm leading-6 outline-none placeholder:text-[#667069]"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-2 block text-xs font-medium text-[#8a8e87]">Categoria</span>
                    <input
                      value={category}
                      onChange={event => setCategory(event.target.value)}
                      maxLength={100}
                      placeholder="Opcional"
                      className="field h-10 w-full px-3 text-sm outline-none placeholder:text-[#667069]"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-medium text-[#8a8e87]">Preço de referência</span>
                    <div className="field flex h-10 items-center px-3">
                      <span className="mr-2 text-xs text-[#737d75]">R$</span>
                      <input
                        value={referencePrice}
                        onChange={event => setReferencePrice(event.target.value)}
                        inputMode="decimal"
                        placeholder="0,00"
                        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#667069]"
                      />
                    </div>
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-xs font-medium text-[#8a8e87]">Público</span>
                  <input
                    value={audience}
                    onChange={event => setAudience(event.target.value)}
                    maxLength={160}
                    placeholder="Ex: profissionais que trabalham em home office"
                    className="field h-10 w-full px-3 text-sm outline-none placeholder:text-[#667069]"
                  />
                </label>

                <fieldset>
                  <legend className="mb-2 text-xs font-medium text-[#8a8e87]">Marketplace</legend>
                  <div className="surface-muted grid grid-cols-3 gap-1 p-1">
                    {marketplaceOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setMarketplace(option.value)}
                        className={`min-h-8 rounded-[4px] px-2 text-xs font-medium ${marketplace === option.value ? 'bg-[#3c8f75] text-white' : 'text-[#a1a8a0] hover:bg-white/[0.05] hover:text-white'}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div className="grid grid-cols-2 gap-4">
                  <fieldset>
                    <legend className="mb-2 text-xs font-medium text-[#8a8e87]">Condição</legend>
                    <div className="surface-muted grid grid-cols-2 gap-1 p-1">
                      {(['novo', 'usado'] as ProductCondition[]).map(value => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setCondition(value)}
                          className={`min-h-8 rounded-[4px] text-xs font-medium ${condition === value ? 'bg-[#3c8f75] text-white' : 'text-[#a1a8a0] hover:bg-white/[0.05] hover:text-white'}`}
                        >
                          {value === 'novo' ? 'Novo' : 'Usado'}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <label className="block">
                    <span className="mb-2 block text-xs font-medium text-[#8a8e87]">Tom</span>
                    <select value={tone} onChange={event => setTone(event.target.value as ListingTone)} className="field h-10 w-full px-3 text-sm outline-none">
                      {toneOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                </div>

                {error && (
                  <div className="flex items-start gap-3 rounded-[5px] border border-[#d9aaa0] bg-[#f7e7e3] p-3 text-sm text-[#8a3326]" role="alert">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || (!productName.trim() && !imageFile)}
                  className="button-primary w-full px-5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {loading ? 'Gerando anúncio...' : 'Gerar anúncio'}
                </button>
              </div>
            </form>

            <section className="min-w-0 space-y-5" aria-live="polite">
              {loading && (
                <div className="surface flex min-h-[480px] flex-col items-center justify-center gap-4 p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-[#66b89d]" />
                  <div>
                    <h3 className="text-base font-semibold">Preparando o anúncio</h3>
                    <p className="mt-1 text-sm text-[#8a8e87]">Analisando as informações do produto.</p>
                  </div>
                </div>
              )}

              {!loading && !listing && (
                <div className="surface flex min-h-[480px] flex-col items-center justify-center p-8 text-center">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[6px] border border-[#376b5a] bg-[#19372e] text-[#66b89d]">
                    <WandSparkles className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-semibold">Anúncio ainda não gerado</h3>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-[#8a8e87]">O resultado editável será exibido nesta área.</p>
                </div>
              )}

              {!loading && listing && (
                <>
                  <div className="surface overflow-hidden">
                    <div className="flex items-center justify-between border-b border-[#d7d8d0] px-5 py-4">
                      <div>
                        <p className="text-xs text-[#8a8e87]">Conteúdo gerado</p>
                        <h3 className="mt-0.5 text-sm font-semibold">Rascunho do anúncio</h3>
                      </div>
                      <button type="button" onClick={() => copyText('all')} className="button-secondary px-3 text-xs">
                        {copied === 'all' ? <Check className="h-4 w-4 text-[#66b89d]" /> : <Clipboard className="h-4 w-4" />}
                        {copied === 'all' ? 'Copiado' : 'Copiar tudo'}
                      </button>
                    </div>

                    <div className="space-y-6 p-5">
                      <div>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <label htmlFor="generated-title" className="text-xs font-medium text-[#8a8e87]">Título</label>
                          <span className={`text-xs ${listing.title.length >= 58 ? 'text-[#e68c7e]' : 'text-[#737d75]'}`}>{listing.title.length}/60</span>
                        </div>
                        <div className="field flex items-start gap-2 p-3">
                          <textarea
                            id="generated-title"
                            value={listing.title}
                            onChange={event => setListing({ ...listing, title: event.target.value.slice(0, 60) })}
                            rows={2}
                            className="min-w-0 flex-1 resize-none bg-transparent text-base font-semibold leading-6 outline-none"
                          />
                          <button type="button" onClick={() => copyText('title')} className="icon-button shrink-0" title="Copiar título" aria-label="Copiar título">
                            {copied === 'title' ? <Check className="h-4 w-4 text-[#66b89d]" /> : <Clipboard className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <label htmlFor="generated-description" className="text-xs font-medium text-[#8a8e87]">Descrição</label>
                          <button type="button" onClick={() => copyText('description')} className="icon-button" title="Copiar descrição" aria-label="Copiar descrição">
                            {copied === 'description' ? <Check className="h-4 w-4 text-[#66b89d]" /> : <Clipboard className="h-4 w-4" />}
                          </button>
                        </div>
                        <textarea
                          id="generated-description"
                          value={listing.description}
                          onChange={event => setListing({ ...listing, description: event.target.value })}
                          rows={13}
                          className="field w-full resize-y px-4 py-3 text-sm leading-7 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-5 lg:grid-cols-2">
                    <div className="surface p-5">
                      <div className="mb-4 flex items-center gap-2">
                        <Tag className="h-4 w-4 text-[#66b89d]" />
                        <h3 className="text-sm font-semibold">Classificação</h3>
                      </div>
                      <p className="text-xs text-[#8a8e87]">Categoria sugerida</p>
                      <p className="mt-1 text-sm font-medium">{listing.category}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {listing.keywords.map(keyword => (
                          <span key={keyword} className="rounded-[4px] border border-[#376b5a] bg-[#19372e] px-2.5 py-1 text-xs text-[#8fd0ba]">{keyword}</span>
                        ))}
                      </div>
                    </div>

                    <div className="surface p-5">
                      <p className="text-xs text-[#8a8e87]">Preço sugerido</p>
                      <p className="data-number mt-1 text-2xl font-semibold text-[#66b89d]">{formatCurrency(listing.suggestedPrice.recommended)}</p>
                      <p className="mt-1 text-xs text-[#737d75]">Faixa de {formatCurrency(listing.suggestedPrice.min)} a {formatCurrency(listing.suggestedPrice.max)}</p>
                      <p className="mt-4 text-sm leading-6 text-[#a1a8a0]">{listing.suggestedPrice.rationale}</p>
                    </div>
                  </div>

                  <div className="surface grid gap-0 overflow-hidden lg:grid-cols-2 lg:divide-x lg:divide-[#303630]">
                    <div className="p-5">
                      <h3 className="mb-3 text-sm font-semibold">Destaques</h3>
                      <ul className="space-y-2">
                        {listing.highlights.map(item => (
                          <li key={item} className="flex gap-2 text-sm leading-6 text-[#a1a8a0]">
                            <Check className="mt-1 h-4 w-4 shrink-0 text-[#66b89d]" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="border-t border-[#303630] p-5 lg:border-t-0">
                      <h3 className="mb-3 text-sm font-semibold">Antes de publicar</h3>
                      {listing.warnings.length ? (
                        <ul className="space-y-2">
                          {listing.warnings.map(item => (
                            <li key={item} className="flex gap-2 text-sm leading-6 text-[#dca45e]">
                              <AlertCircle className="mt-1 h-4 w-4 shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-[#8a8e87]">Nenhuma pendência apontada pela análise.</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
