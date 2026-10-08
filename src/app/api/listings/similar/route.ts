import { NextResponse } from 'next/server';
import { isSessionAuthenticated, unauthorizedJson } from '@/lib/auth';
import { searchSimilarListings } from '@/services/marketplace/search';

const ALLOWED_MARKETPLACES = new Set(['mercado_livre', 'amazon', 'ambos']);

export async function GET(request: Request) {
  if (!(await isSessionAuthenticated())) return unauthorizedJson();
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
  const marketplace = searchParams.get('marketplace') || 'mercado_livre';
  if (!query || query.length < 2 || query.length > 140 || !ALLOWED_MARKETPLACES.has(marketplace)) {
    return NextResponse.json({ success: false, error: 'Parâmetros de busca inválidos.' }, { status: 400 });
  }
  const products = await searchSimilarListings(query, marketplace as 'mercado_livre' | 'amazon' | 'ambos');
  return NextResponse.json({ success: true, products });
}
