import { TOKEN_REFRESH_BUFFER_MS } from './constants';
import { BlingApiError } from './errors';
import { exchangeAuthorizationCode, refreshBlingTokens, revokeBlingToken } from './oauth';
import { toIntegrationRecord, type TokenStore } from './tokenStore';
import type { BlingIntegrationRecord, BlingTokenData } from './types';

let refreshInFlight: Promise<BlingIntegrationRecord> | null = null;

export class BlingTokenManager {
  constructor(private readonly store: TokenStore) {}

  async getRecord(): Promise<BlingIntegrationRecord | null> {
    return this.store.get();
  }

  async isConnected(): Promise<boolean> {
    const record = await this.store.get();
    return Boolean(record?.access_token);
  }

  async saveTokens(tokenData: BlingTokenData): Promise<BlingIntegrationRecord> {
    const previous = await this.store.get();
    const record = toIntegrationRecord(tokenData, previous);
    if (previous?.refresh_token && !record.refresh_token) {
      record.refresh_token = previous.refresh_token;
    }
    await this.store.save(record);
    return record;
  }

  async exchangeCodeForTokens(code: string): Promise<BlingIntegrationRecord> {
    const tokens = await exchangeAuthorizationCode(code);
    return this.saveTokens(tokens);
  }

  async refreshAccessToken(): Promise<BlingIntegrationRecord> {
    if (refreshInFlight) {
      return refreshInFlight;
    }

    refreshInFlight = (async () => {
      const current = await this.store.get();
      if (!current?.refresh_token) {
        throw new BlingApiError({
          status: 401,
          message: 'Refresh token do Bling ausente',
          userMessage: 'Sessão do Bling expirada. Reconecte sua conta.',
        });
      }

      const refreshed = await refreshBlingTokens(current.refresh_token);
      return this.saveTokens(refreshed);
    })();

    try {
      return await refreshInFlight;
    } finally {
      refreshInFlight = null;
    }
  }

  async getValidAccessToken(): Promise<string> {
    let record = await this.store.get();
    if (!record?.access_token) {
      throw new BlingApiError({
        status: 401,
        message: 'Bling não autenticado',
        userMessage: 'Bling ERP não conectado. Autorize a integração para continuar.',
      });
    }

    if (Date.now() >= record.expires_at - TOKEN_REFRESH_BUFFER_MS) {
      record = await this.refreshAccessToken();
    }

    return record.access_token;
  }

  async disconnect(): Promise<void> {
    const current = await this.store.get();
    const tokenToRevoke = current?.refresh_token || current?.access_token;
    if (tokenToRevoke) {
      await revokeBlingToken(tokenToRevoke);
    }
    await this.store.clear();
  }
}
