import 'server-only';

import * as cheerio from 'cheerio';

export type SimilarListingMarketplace = 'mercado_livre' | 'amazon';

export interface SimilarListing {
  title: string;
  price: string;
  link: string;
  seller: string;
  freeShipping: boolean;
  marketplace: SimilarListingMarketplace;
}

const MAX_HTML_BYTES = 1_500_000;
const REQUEST_TIMEOUT_MS = 4_000;

function safeLink(value: string, marketplace: SimilarListingMarketplace): string {
  try {
    const url = new URL(value, marketplace === 'amazon' ? 'https://www.amazon.com.br' : undefined);
    const host = url.hostname.toLowerCase();
    const isAllowed = marketplace === 'amazon'
      ? host === 'amazon.com.br' || host.endsWith('.amazon.com.br')
      : host === 'mercadolivre.com.br' || host.endsWith('.mercadolivre.com.br');
    return url.protocol === 'https:' && isAllowed ? url.toString() : '';
  } catch {
    return '';
  }
}

async function fetchMarketplaceHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
      cache: 'no-store',
    });
    if (!response.ok) return '';
    const declaredSize = Number(response.headers.get('content-length') || 0);
    if (declaredSize > MAX_HTML_BYTES) return '';
    return (await response.text()).slice(0, MAX_HTML_BYTES);
  } catch (error) {
    console.warn('[MarketplaceSearch] Consulta indisponível:', error instanceof Error ? error.name : 'unknown');
    return '';
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function searchMercadoLivre(keyword: string, limit = 10): Promise<{ totalResults: string; products: SimilarListing[] }> {
  const slug = encodeURIComponent(keyword).replace(/%20/g, '-');
  const html = await fetchMarketplaceHtml(`https://lista.mercadolivre.com.br/${slug}`);
  if (!html) return { totalResults: 'N/A', products: [] };

  const $ = cheerio.load(html);
  const totalResults = $('.ui-search-search-result__quantity-results').text().trim() || 'N/A';
  const products: SimilarListing[] = [];

  $('.ui-search-layout__item').slice(0, limit).each((_, element) => {
    const title = $(element).find('.ui-search-item__title, .poly-component__title').text().trim();
    const priceInt = $(element).find('.andes-money-amount__fraction').first().text().trim();
    const priceCents = $(element).find('.andes-money-amount__cents').first().text().trim();
    if (!title) return;
    products.push({
      title,
      price: priceInt ? `R$ ${priceInt}${priceCents ? `,${priceCents}` : ',00'}` : 'Preço não informado',
      link: safeLink($(element).find('a').first().attr('href') || '', 'mercado_livre'),
      seller: $(element).find('.ui-search-official-store-label, .poly-component__seller').text().trim() || 'Vendedor não informado',
      freeShipping: $(element).text().toLowerCase().includes('frete grátis'),
      marketplace: 'mercado_livre',
    });
  });
  return { totalResults, products };
}

export async function searchAmazon(keyword: string, limit = 6): Promise<SimilarListing[]> {
  const html = await fetchMarketplaceHtml(`https://www.amazon.com.br/s?k=${encodeURIComponent(keyword)}`);
  if (!html) return [];
  const $ = cheerio.load(html);
  const products: SimilarListing[] = [];
  $('div[data-component-type="s-search-result"]').slice(0, limit).each((_, element) => {
    const title = $(element).find('h2 span').first().text().trim();
    const price = $(element).find('.a-price .a-offscreen').first().text().trim();
    const link = $(element).find('h2 a').first().attr('href') || '';
    const seller = $(element).find('.a-row.a-size-base.a-color-secondary').first().text().replace(/\s+/g, ' ').trim();
    if (!title) return;
    products.push({
      title,
      price: price || 'Preço não informado',
      link: safeLink(link, 'amazon'),
      seller: seller || 'Amazon',
      freeShipping: $(element).text().toLowerCase().includes('frete grátis') || $(element).find('.a-icon-prime').length > 0,
      marketplace: 'amazon',
    });
  });
  return products;
}

export async function searchSimilarListings(keyword: string, marketplace: 'mercado_livre' | 'amazon' | 'ambos', limit = 8): Promise<SimilarListing[]> {
  if (marketplace === 'mercado_livre') return (await searchMercadoLivre(keyword, limit)).products;
  if (marketplace === 'amazon') return searchAmazon(keyword, limit);
  const perMarketplace = Math.max(3, Math.ceil(limit / 2));
  const [mercadoLivre, amazon] = await Promise.all([
    searchMercadoLivre(keyword, perMarketplace),
    searchAmazon(keyword, perMarketplace),
  ]);
  return [...mercadoLivre.products, ...amazon].slice(0, limit);
}
