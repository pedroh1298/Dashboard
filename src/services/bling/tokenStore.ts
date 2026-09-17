import type { ResponseCookies } from 'next/dist/compiled/@edge-runtime/cookies';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import {
  OWNER_ID,
  TOKEN_AT_COOKIE_PREFIX,
  TOKEN_COOKIE_CHUNK_SIZE,
  TOKEN_COOKIE_MAX_AGE,
  TOKEN_COOKIE_MAX_CHUNKS,
  TOKEN_META_COOKIE,
  TOKEN_RT_COOKIE_PREFIX,
} from './constants';
import { decryptString, encryptString } from './crypto';
import type { BlingIntegrationRecord, BlingTokenData } from './types';

export interface TokenStore {
  get(): Promise<BlingIntegrationRecord | null>;
  save(record: BlingIntegrationRecord): Promise<void>;
  clear(): Promise<void>;
}

interface CookieMeta {
  nAt: number;
  nRt: number;
  expiresAt: number;
  connectedAt: number;
  updatedAt: number;
  scope?: string;
  status: 'active' | 'disconnected' | 'expired';
  ownerId: string;
}

type MutableCookies = Pick<ResponseCookies, 'set' | 'delete' | 'get'>;
type ReadableCookies = Pick<ReadonlyRequestCookies, 'get'>;

function splitChunks(value: string): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < value.length; i += TOKEN_COOKIE_CHUNK_SIZE) {
    chunks.push(value.slice(i, i + TOKEN_COOKIE_CHUNK_SIZE));
  }
  if (chunks.length > TOKEN_COOKIE_MAX_CHUNKS) {
    throw new Error('Token do Bling excede o limite de armazenamento seguro em cookie.');
  }
  return chunks.length > 0 ? chunks : [''];
}

function cookieOptions(maxAge = TOKEN_COOKIE_MAX_AGE) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

export class CookieTokenStore implements TokenStore {
  constructor(private readonly jar: ReadableCookies & Partial<MutableCookies>) {}

  async get(): Promise<BlingIntegrationRecord | null> {
    const rawMeta = this.jar.get(TOKEN_META_COOKIE)?.value;
    if (!rawMeta) return null;

    try {
      const meta = JSON.parse(rawMeta) as CookieMeta;
      const accessToken = await this.readChunks(TOKEN_AT_COOKIE_PREFIX, meta.nAt);
      const refreshToken = await this.readChunks(TOKEN_RT_COOKIE_PREFIX, meta.nRt);
      if (!accessToken) return null;

      return {
        ownerId: meta.ownerId || OWNER_ID,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: Math.max(0, Math.floor((meta.expiresAt - Date.now()) / 1000)),
        token_type: 'Bearer',
        scope: meta.scope,
        expires_at: meta.expiresAt,
        connected_at: meta.connectedAt,
        updated_at: meta.updatedAt,
        status: meta.status || 'active',
      };
    } catch {
      return null;
    }
  }

  async save(record: BlingIntegrationRecord): Promise<void> {
    if (!this.jar.set || !this.jar.delete) {
      throw new Error('O armazenamento de tokens do Bling precisa de cookies graváveis neste contexto.');
    }

    const accessChunks = splitChunks(await encryptString(record.access_token));
    const refreshChunks = splitChunks(await encryptString(record.refresh_token || ''));

    this.clearChunkCookies(TOKEN_AT_COOKIE_PREFIX);
    this.clearChunkCookies(TOKEN_RT_COOKIE_PREFIX);

    accessChunks.forEach((chunk, index) => {
      this.jar.set!(`${TOKEN_AT_COOKIE_PREFIX}${index}`, chunk, cookieOptions());
    });
    refreshChunks.forEach((chunk, index) => {
      this.jar.set!(`${TOKEN_RT_COOKIE_PREFIX}${index}`, chunk, cookieOptions());
    });

    const meta: CookieMeta = {
      nAt: accessChunks.length,
      nRt: refreshChunks.length,
      expiresAt: record.expires_at,
      connectedAt: record.connected_at,
      updatedAt: record.updated_at,
      scope: record.scope,
      status: record.status,
      ownerId: record.ownerId || OWNER_ID,
    };

    this.jar.set(TOKEN_META_COOKIE, JSON.stringify(meta), cookieOptions());
  }

  async clear(): Promise<void> {
    if (!this.jar.delete) return;
    const rawMeta = this.jar.get(TOKEN_META_COOKIE)?.value;
    let nAt = TOKEN_COOKIE_MAX_CHUNKS;
    let nRt = TOKEN_COOKIE_MAX_CHUNKS;
    if (rawMeta) {
      try {
        const meta = JSON.parse(rawMeta) as CookieMeta;
        nAt = meta.nAt;
        nRt = meta.nRt;
      } catch {
        // ignore
      }
    }
    this.clearChunkCookies(TOKEN_AT_COOKIE_PREFIX, nAt);
    this.clearChunkCookies(TOKEN_RT_COOKIE_PREFIX, nRt);
    this.jar.delete(TOKEN_META_COOKIE);
  }

  private async readChunks(prefix: string, count: number): Promise<string> {
    const parts: string[] = [];
    for (let i = 0; i < count; i += 1) {
      const part = this.jar.get(`${prefix}${i}`)?.value;
      if (!part) return '';
      parts.push(part);
    }
    if (parts.length === 0) return '';
    return decryptString(parts.join(''));
  }

  private clearChunkCookies(prefix: string, count = TOKEN_COOKIE_MAX_CHUNKS) {
    if (!this.jar.delete) return;
    for (let i = 0; i < Math.max(count, TOKEN_COOKIE_MAX_CHUNKS); i += 1) {
      this.jar.delete(`${prefix}${i}`);
    }
  }
}

export function toIntegrationRecord(
  tokenData: Omit<BlingTokenData, 'expires_at'> & { expires_at?: number },
  previous?: BlingIntegrationRecord | null
): BlingIntegrationRecord {
  const now = Date.now();
  const expiresAt = tokenData.expires_at || now + tokenData.expires_in * 1000;
  return {
    ownerId: previous?.ownerId || OWNER_ID,
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_in: tokenData.expires_in,
    token_type: tokenData.token_type || 'Bearer',
    scope: tokenData.scope,
    expires_at: expiresAt,
    connected_at: previous?.connected_at || now,
    updated_at: now,
    status: 'active',
  };
}

export class MemoryTokenStore implements TokenStore {
  constructor(private record: BlingIntegrationRecord | null = null) {}

  async get() {
    return this.record;
  }

  async save(record: BlingIntegrationRecord) {
    this.record = record;
  }

  async clear() {
    this.record = null;
  }
}
