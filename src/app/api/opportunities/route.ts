import { NextResponse } from 'next/server';
import { AIService } from '@/services/ai';
import { searchMercadoLivre } from '@/services/marketplace/search';

const MAX_QUERY_LENGTH = 100;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim().replace(/[\u0000-\u001F\u007F]/g, '');
  if (!query || query.length < 2 || query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ success: false, error: 'Informe um termo de busca válido.' }, { status: 400 });
  }

  try {
    const { totalResults, products } = await searchMercadoLivre(query, 10);
    const dataSummary = products.length === 0
      ? `Termo pesquisado: "${query}"\nA consulta direta ao Mercado Livre ficou indisponível. Analise o produto no mercado brasileiro de e-commerce com base no conhecimento disponível.`
      : `Termo pesquisado: "${query}"\nTotal de resultados no Mercado Livre: ${totalResults}\n\nAnúncios encontrados:\n${products.map((product, index) => `${index + 1}. "${product.title}" — ${product.price} | ${product.freeShipping ? 'Frete Grátis' : 'Frete Pago'} | Vendedor: ${product.seller}`).join('\n')}`;

    const report = await AIService.getProvider().generateMarketReport({ category: query, competitorsData: dataSummary });
    return NextResponse.json({ success: true, query, totalResults, products, report });
  } catch (error) {
    console.error('[Opportunities] Falha na análise:', error instanceof Error ? error.name : 'unknown');
    return NextResponse.json({ success: false, error: 'Não foi possível concluir a análise agora.' }, { status: 500 });
  }
}
