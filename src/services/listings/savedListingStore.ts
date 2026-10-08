import 'server-only';

import type { SavedListing } from './types';

const BUCKET_NAME = 'dashboard-private';
const OBJECT_PATH = 'admin/saved-listings.json';
const MAX_SAVED_LISTINGS = 100;

interface SupabaseConfig {
  url: string;
  key: string;
  legacyJwtKey: boolean;
}

function getSecretKey(): string | undefined {
  const direct = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (direct) return direct;
  const keySet = process.env.SUPABASE_SECRET_KEYS?.trim();
  if (!keySet) return undefined;
  try {
    const parsed = JSON.parse(keySet) as Record<string, string>;
    return parsed.default || Object.values(parsed).find(Boolean);
  } catch {
    return undefined;
  }
}

function getConfig(): SupabaseConfig {
  const url = process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = getSecretKey();
  if (!url || !key) throw new Error('O armazenamento seguro do Supabase não está configurado.');
  return { url: url.replace(/\/$/, ''), key, legacyJwtKey: !key.startsWith('sb_secret_') };
}

function headers(config: SupabaseConfig, contentType = 'application/json'): Record<string, string> {
  const result: Record<string, string> = { apikey: config.key, 'Content-Type': contentType };
  if (config.legacyJwtKey) result.Authorization = `Bearer ${config.key}`;
  return result;
}

async function ensureBucket(config: SupabaseConfig): Promise<void> {
  const current = await fetch(`${config.url}/storage/v1/bucket/${BUCKET_NAME}`, {
    headers: headers(config),
    cache: 'no-store',
  });
  if (current.ok) return;
  if (current.status !== 404) throw new Error(`Não foi possível consultar o armazenamento (${current.status}).`);

  const created = await fetch(`${config.url}/storage/v1/bucket`, {
    method: 'POST',
    headers: headers(config),
    body: JSON.stringify({ id: BUCKET_NAME, name: BUCKET_NAME, public: false, file_size_limit: 2_000_000 }),
    cache: 'no-store',
  });
  if (!created.ok && created.status !== 409) {
    throw new Error(`Não foi possível preparar o armazenamento (${created.status}).`);
  }
}

function objectUrl(config: SupabaseConfig): string {
  return `${config.url}/storage/v1/object/${BUCKET_NAME}/${OBJECT_PATH}`;
}

export async function getSavedListings(): Promise<SavedListing[]> {
  const config = getConfig();
  await ensureBucket(config);
  const response = await fetch(objectUrl(config), { headers: headers(config), cache: 'no-store' });
  if (response.status === 404) return [];
  if (!response.ok) throw new Error(`Não foi possível carregar os anúncios salvos (${response.status}).`);
  const data = await response.json();
  return Array.isArray(data) ? data.slice(0, MAX_SAVED_LISTINGS) : [];
}

async function writeSavedListings(listings: SavedListing[]): Promise<void> {
  const config = getConfig();
  await ensureBucket(config);
  const response = await fetch(objectUrl(config), {
    method: 'POST',
    headers: { ...headers(config), 'x-upsert': 'true' },
    body: JSON.stringify(listings.slice(0, MAX_SAVED_LISTINGS)),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Não foi possível salvar o anúncio (${response.status}).`);
}

export async function upsertSavedListing(listing: SavedListing): Promise<SavedListing[]> {
  const current = await getSavedListings();
  const existing = current.find(item => item.id === listing.id);
  if (existing) listing.createdAt = existing.createdAt;
  const next = [listing, ...current.filter(item => item.id !== listing.id)]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  await writeSavedListings(next);
  return next;
}

export async function deleteSavedListing(id: string): Promise<SavedListing[]> {
  const current = await getSavedListings();
  const next = current.filter(item => item.id !== id);
  await writeSavedListings(next);
  return next;
}
