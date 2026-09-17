import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { AIService } from '@/services/ai';

interface ScrapedProduct {
  title: string;
  price: string;
  link: string;
  seller: string;
  freeShipping: boolean;
}

/**
 * Raspa os resultados de busca do Mercado Livre para um termo específico com timeout e tolerância a falhas.
 */
async function scrapeMLSearch(keyword: string): Promise<{ totalResults: string; products: ScrapedProduct[] }> {
  const encoded = encodeURIComponent(keyword);
  const url = `https://lista.mercadolivre.com.br/${encoded.replace(/%20/g, '-')}`;

  // Adiciona um AbortController com timeout de 3.5 segundos.
  // Isso impede que a requisição trave a rota da Vercel (limite de 10s no plano Free)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[Scraper] ML retornou status ${res.status}`);
      return { totalResults: 'N/A', products: [] };
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const totalText = $('.ui-search-search-result__quantity-results').text().trim();
    const totalResults = totalText || 'N/A';

    const products: ScrapedProduct[] = [];

    $('.ui-search-layout__item').slice(0, 10).each((_, el) => {
      const title = $(el).find('.ui-search-item__title, .poly-component__title').text().trim();
      
      const priceInt = $(el).find('.andes-money-amount__fraction').first().text().trim();
      const priceCents = $(el).find('.andes-money-amount__cents').first().text().trim();
      const price = priceInt ? `R$ ${priceInt}${priceCents ? ',' + priceCents : ',00'}` : 'N/A';

      const link = $(el).find('a').first().attr('href') || '';
      const seller = $(el).find('.ui-search-official-store-label, .poly-component__seller').text().trim() || 'Vendedor comum';
      const freeShipping = $(el).text().toLowerCase().includes('frete grátis');

      if (title) {
        products.push({ title, price, link, seller, freeShipping });
      }
    });

    return { totalResults, products };
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    const err = error instanceof Error ? error : new Error('Erro desconhecido');
    console.error(`[Scraper] Erro ao raspar ML para "${keyword}":`, err.name === 'AbortError' ? 'Timeout' : err.message);
    // Retorna vazio em caso de timeout ou bloqueio de IP (comum em servidores de nuvem como Vercel/AWS)
    return { totalResults: 'N/A', products: [] };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ success: false, error: 'Informe um termo de busca válido.' }, { status: 400 });
  }

  try {
    // 1. Executa a raspagem com limite de tempo
    const { totalResults, products } = await scrapeMLSearch(query);

    let dataSummary = '';

    // 2. Trata o fluxo caso o Mercado Livre bloqueie o IP da Vercel (AWS) ou dê Timeout
    if (products.length === 0) {
      console.log(`[Radar] ML bloqueou ou falhou para "${query}". Executando análise com IA pura.`);
      dataSummary = `Termo pesquisado: "${query}"
Atenção: A raspagem direta do Mercado Livre foi bloqueada (comum em servidores de nuvem/Vercel). 
Por favor, analise este produto no mercado brasileiro de e-commerce usando seu conhecimento nativo, assumindo que é um produto altamente pesquisado no Mercado Livre.`;
    } else {
      const productList = products.map((p, i) => 
        `${i + 1}. "${p.title}" — ${p.price} | ${p.freeShipping ? 'Frete Grátis' : 'Frete Pago'} | Vendedor: ${p.seller}`
      ).join('\n');

      dataSummary = `Termo pesquisado: "${query}"
Total de resultados no Mercado Livre: ${totalResults}

Top 10 anúncios encontrados para contextualizar preços:
${productList}`;
    }

    // 3. Envia para o Gemini analisar (com ou sem os dados raspados)
    const ai = AIService.getProvider();
    const report = await ai.generateMarketReport({
      category: query,
      competitorsData: dataSummary,
    });

    return NextResponse.json({
      success: true,
      query,
      totalResults,
      products,
      report,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro na API de Oportunidades:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
