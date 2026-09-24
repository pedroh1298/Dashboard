import 'server-only';

import { OWNER_ID } from './constants';
import { decryptString, encryptString } from './crypto';
import type { BlingIntegrationRecord } from './types';
import type { TokenStore } from './tokenStore';

const TABLE_NAME = 'bling_integrations';

interface SupabaseConfig {
  url: string;
  key: string;
  legacyJwtKey: boolean;
}

interface BlingIntegrationRow {
  owner_id: string;
  access_token_ciphertext: string;
  refresh_token_ciphertext: string;
  expires_in: number;
  token_type: string;
  scope: string | null;
  expires_at: number;
  connected_at: number;
  updated_at: number;
  status: 'active' | 'disconnected' | 'expired';
}

function getConfig(): SupabaseConfig | null {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SECRET_KEY?.trim()
    || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) return null;

  return {
    url: url.replace(/\/$/, ''),
    key,
    legacyJwtKey: !key.startsWith('sb_secret_'),
  };
}

export function isSupabaseTokenStoreConfigured(): boolean {
  return getConfig() !== null;
}

export class SupabaseTokenStore implements TokenStore {
  private readonly config: SupabaseConfig;

  constructor(private readonly ownerId = OWNER_ID) {
    const config = getConfig();
    if (!config) {
      throw new Error('SUPABASE_URL e SUPABASE_SECRET_KEY precisam estar configurados no servidor.');
    }
    this.config = config;
  }

  async get(): Promise<BlingIntegrationRecord | null> {
    const url = this.tableUrl();
    url.searchParams.set('owner_id', `eq.${this.ownerId}`);
    url.searchParams.set('select', '*');
    url.searchParams.set('limit', '1');

    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers(),
      cache: 'no-store',
    });

    await this.assertOk(response, 'consultar');
    const rows = await response.json() as BlingIntegrationRow[];
    const row = rows[0];
    if (!row) return null;

    const [accessToken, refreshToken] = await Promise.all([
      decryptString(row.access_token_ciphertext),
      decryptString(row.refresh_token_ciphertext),
    ]);

    return {
      ownerId: row.owner_id,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: row.expires_in,
      token_type: row.token_type,
      scope: row.scope || undefined,
      expires_at: row.expires_at,
      connected_at: row.connected_at,
      updated_at: row.updated_at,
      status: row.status,
    };
  }

  async save(record: BlingIntegrationRecord): Promise<void> {
    const [accessTokenCiphertext, refreshTokenCiphertext] = await Promise.all([
      encryptString(record.access_token),
      encryptString(record.refresh_token || ''),
    ]);

    const row: BlingIntegrationRow = {
      owner_id: this.ownerId,
      access_token_ciphertext: accessTokenCiphertext,
      refresh_token_ciphertext: refreshTokenCiphertext,
      expires_in: record.expires_in,
      token_type: record.token_type,
      scope: record.scope || null,
      expires_at: record.expires_at,
      connected_at: record.connected_at,
      updated_at: record.updated_at,
      status: record.status,
    };

    const url = this.tableUrl();
    url.searchParams.set('on_conflict', 'owner_id');

    const response = await fetch(url, {
      method: 'POST',
      headers: this.headers('resolution=merge-duplicates,return=minimal'),
      body: JSON.stringify(row),
      cache: 'no-store',
    });

    await this.assertOk(response, 'salvar');
  }

  async clear(): Promise<void> {
    const url = this.tableUrl();
    url.searchParams.set('owner_id', `eq.${this.ownerId}`);

    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.headers('return=minimal'),
      cache: 'no-store',
    });

    await this.assertOk(response, 'remover');
  }

  private tableUrl(): URL {
    return new URL(`/rest/v1/${TABLE_NAME}`, this.config.url);
  }

  private headers(prefer?: string): HeadersInit {
    const headers: Record<string, string> = {
      apikey: this.config.key,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    if (this.config.legacyJwtKey) {
      headers.Authorization = `Bearer ${this.config.key}`;
    }
    if (prefer) headers.Prefer = prefer;

    return headers;
  }

  private async assertOk(response: Response, operation: string): Promise<void> {
    if (response.ok) return;

    const requestId = response.headers.get('sb-request-id');
    throw new Error(
      `Não foi possível ${operation} a integração do Bling no Supabase (${response.status})`
      + (requestId ? ` [${requestId}]` : '')
    );
  }
}