import { NextResponse } from 'next/server';
import { isSameOriginRequest, isSessionAuthenticated, unauthorizedJson } from '@/lib/auth';
import type { CompleteListingResponse, ListingMarketplace, ProductCondition } from '@/services/ai';
import { deleteSavedListing, getSavedListings, upsertSavedListing } from '@/services/listings/savedListingStore';
import type { SavedListing } from '@/services/listings/types';

const ALLOWED_MARKETPLACES = new Set<ListingMarketplace>(['mercado_livre', 'amazon', 'ambos']);
const ALLOWED_CONDITIONS = new Set<ProductCondition>(['novo', 'usado']);
const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function text(value: unknown, max: number, fallback = ''): string {
  return typeof value === 'string' ? value.replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, max) : fallback;
}

function list(value: unknown, count: number, max: number): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').map(item => text(item, max)).filter(Boolean).slice(0, count)
    : [];
}

function price(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 10_000_000
    ? Math.round(value * 100) / 100
    : 0;
}

function cleanListing(value: unknown): CompleteListingResponse | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const suggested = raw.suggestedPrice && typeof raw.suggestedPrice === 'object'
    ? raw.suggestedPrice as Record<string, unknown>
    : {};
  const title = text(raw.title, 60);
  const description = text(raw.description, 12_000);
  if (!title || !description) return null;
  return {
    title,
    description,
    keywords: list(raw.keywords, 10, 80),
    category: text(raw.category, 100, 'Não identificada'),
    highlights: list(raw.highlights, 6, 240),
    suggestedPrice: {
      min: price(suggested.min),
      recommended: price(suggested.recommended),
      max: price(suggested.max),
      rationale: text(suggested.rationale, 500),
    },
    warnings: list(raw.warnings, 6, 240),
  };
}

export async function GET() {
  if (!(await isSessionAuthenticated())) return unauthorizedJson();
  try {
    return NextResponse.json({ success: true, listings: await getSavedListings() });
  } catch (error) {
    console.error('[SavedListings] Falha ao carregar:', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ success: false, error: 'Não foi possível carregar os anúncios salvos.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isSessionAuthenticated())) return unauthorizedJson();
  if (!isSameOriginRequest(request)) return NextResponse.json({ success: false, error: 'Origem inválida.' }, { status: 403 });
  if (Number(request.headers.get('content-length') || 0) > 100_000) {
    return NextResponse.json({ success: false, error: 'Anúncio muito grande.' }, { status: 413 });
  }
  try {
    const body = await request.json();
    const marketplace = body.marketplace as ListingMarketplace;
    const condition = body.condition as ProductCondition;
    const listing = cleanListing(body.listing);
    if (!listing || !ALLOWED_MARKETPLACES.has(marketplace) || !ALLOWED_CONDITIONS.has(condition)) {
      return NextResponse.json({ success: false, error: 'Dados do anúncio inválidos.' }, { status: 400 });
    }
    const id = typeof body.id === 'string' && ID_PATTERN.test(body.id) ? body.id : crypto.randomUUID();
    const now = new Date().toISOString();
    const saved: SavedListing = {
      id,
      productName: text(body.productName, 140, listing.title),
      marketplace,
      condition,
      listing,
      createdAt: now,
      updatedAt: now,
    };
    await upsertSavedListing(saved);
    return NextResponse.json({ success: true, listing: saved });
  } catch (error) {
    console.error('[SavedListings] Falha ao salvar:', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ success: false, error: 'Não foi possível salvar o anúncio.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isSessionAuthenticated())) return unauthorizedJson();
  if (!isSameOriginRequest(request)) return NextResponse.json({ success: false, error: 'Origem inválida.' }, { status: 403 });
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!ID_PATTERN.test(id)) return NextResponse.json({ success: false, error: 'Identificador inválido.' }, { status: 400 });
  try {
    await deleteSavedListing(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[SavedListings] Falha ao excluir:', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ success: false, error: 'Não foi possível excluir o anúncio.' }, { status: 500 });
  }
}
