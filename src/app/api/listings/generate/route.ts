import { NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/auth';
import { AIError, AIService, CompleteListingResponse, ListingMarketplace, ListingTone, ProductCondition } from '@/services/ai';

export const runtime = 'nodejs';

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_IMAGE_BYTES + 512 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_MARKETPLACES = new Set<ListingMarketplace>(['mercado_livre', 'amazon', 'ambos']);
const ALLOWED_TONES = new Set<ListingTone>(['direto', 'premium', 'tecnico']);
const ALLOWED_CONDITIONS = new Set<ProductCondition>(['novo', 'usado']);
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 10;

const attempts = new Map<string, { count: number; resetAt: number }>();

function cleanText(value: FormDataEntryValue | null, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function clientKey(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'admin';
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > RATE_LIMIT;
}

function hasValidImageSignature(bytes: Uint8Array, mimeType: string): boolean {
  if (mimeType === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === 'image/png') return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (mimeType === 'image/webp') {
    return String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
      && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  }
  return false;
}

function toFinitePrice(value: FormDataEntryValue | null): number | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const parsed = Number(value.replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 10_000_000) return undefined;
  return Math.round(parsed * 100) / 100;
}

function normalizeListing(value: CompleteListingResponse): CompleteListingResponse {
  const asText = (input: unknown, fallback = '') => typeof input === 'string' ? input.trim() : fallback;
  const asList = (input: unknown, limit: number) => Array.isArray(input)
    ? input.filter((item): item is string => typeof item === 'string').map(item => item.trim()).filter(Boolean).slice(0, limit)
    : [];
  const asPrice = (input: unknown) => typeof input === 'number' && Number.isFinite(input) && input >= 0
    ? Math.round(input * 100) / 100
    : 0;
  const price = value?.suggestedPrice;

  return {
    title: asText(value?.title, 'Anúncio sem título').slice(0, 60),
    description: asText(value?.description),
    keywords: asList(value?.keywords, 10),
    category: asText(value?.category, 'Não identificada').slice(0, 100),
    highlights: asList(value?.highlights, 6),
    suggestedPrice: {
      min: asPrice(price?.min),
      recommended: asPrice(price?.recommended),
      max: asPrice(price?.max),
      rationale: asText(price?.rationale, 'Estimativa gerada a partir dos dados informados.').slice(0, 400),
    },
    warnings: asList(value?.warnings, 6),
  };
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ success: false, error: 'Origem da requisição inválida.' }, { status: 403 });
  }

  const declaredSize = Number(request.headers.get('content-length') || 0);
  if (declaredSize > MAX_REQUEST_BYTES) {
    return NextResponse.json({ success: false, error: 'A imagem deve ter no máximo 4 MB.' }, { status: 413 });
  }

  if (isRateLimited(clientKey(request))) {
    return NextResponse.json(
      { success: false, error: 'Muitas gerações em pouco tempo. Aguarde alguns minutos.' },
      { status: 429, headers: { 'Retry-After': '600' } }
    );
  }

  try {
    const form = await request.formData();
    const productName = cleanText(form.get('productName'), 140);
    const features = cleanText(form.get('features'), 1200)
      .split(/[,;\n]/)
      .map(item => item.trim())
      .filter(Boolean)
      .slice(0, 20);
    const category = cleanText(form.get('category'), 100);
    const audience = cleanText(form.get('audience'), 160);
    const marketplace = cleanText(form.get('marketplace'), 30) as ListingMarketplace;
    const tone = cleanText(form.get('tone'), 20) as ListingTone;
    const condition = cleanText(form.get('condition'), 20) as ProductCondition;
    const referencePrice = toFinitePrice(form.get('referencePrice'));
    const image = form.get('image');

    if (!ALLOWED_MARKETPLACES.has(marketplace) || !ALLOWED_TONES.has(tone) || !ALLOWED_CONDITIONS.has(condition)) {
      return NextResponse.json({ success: false, error: 'Configuração do anúncio inválida.' }, { status: 400 });
    }

    let imageBuffer: string | undefined;
    let mimeType: string | undefined;

    if (image instanceof File && image.size > 0) {
      if (image.size > MAX_IMAGE_BYTES || !ALLOWED_IMAGE_TYPES.has(image.type)) {
        return NextResponse.json({ success: false, error: 'Envie uma imagem JPG, PNG ou WebP de até 4 MB.' }, { status: 400 });
      }
      const bytes = new Uint8Array(await image.arrayBuffer());
      if (!hasValidImageSignature(bytes, image.type)) {
        return NextResponse.json({ success: false, error: 'O arquivo enviado não é uma imagem válida.' }, { status: 400 });
      }
      imageBuffer = Buffer.from(bytes).toString('base64');
      mimeType = image.type;
    }

    if (!productName && !imageBuffer) {
      return NextResponse.json({ success: false, error: 'Informe o nome do produto ou envie uma foto.' }, { status: 400 });
    }

    const provider = AIService.getProvider();
    const result = await provider.generateCompleteListing({
      productName: productName || undefined,
      features,
      category: category || undefined,
      audience: audience || undefined,
      marketplace,
      tone,
      condition,
      referencePrice,
      imageBuffer,
      mimeType,
    });

    return NextResponse.json({ success: true, listing: normalizeListing(result) });
  } catch (error) {
    console.error('[ListingGenerator] Falha na geração:', error);
    const message = error instanceof AIError && error.statusCode === 429
      ? 'O limite temporário da IA foi atingido. Tente novamente em alguns minutos.'
      : 'Não foi possível gerar o anúncio agora. Tente novamente.';
    return NextResponse.json({ success: false, error: message }, { status: error instanceof AIError && error.statusCode === 429 ? 429 : 500 });
  }
}
