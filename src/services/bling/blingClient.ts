import { API_TIMEOUT_MS, BLING_API_BASE, JWT_HEADER, RATE_LIMIT_RETRY_MS } from './constants';
import { BlingApiError, sanitizeBlingErrorBody, userMessageForBlingStatus } from './errors';
import { BlingTokenManager } from './tokenManager';
import type { TokenStore } from './tokenStore';

interface RequestOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>;
  timeoutMs?: number;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class BlingClient {
  private readonly tokens: BlingTokenManager;

  constructor(store: TokenStore) {
    this.tokens = new BlingTokenManager(store);
  }

  get tokenManager() {
    return this.tokens;
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const accessToken = await this.tokens.getValidAccessToken();
    let response = await this.doFetch(endpoint, accessToken, options);

    if (response.status === 401) {
      const refreshed = await this.tokens.refreshAccessToken();
      response = await this.doFetch(endpoint, refreshed.access_token, options);
    }

    if (response.status === 429) {
      await sleep(RATE_LIMIT_RETRY_MS);
      const latest = await this.tokens.getValidAccessToken();
      response = await this.doFetch(endpoint, latest, options);
    }

    if (response.status >= 500) {
      await sleep(400);
      const latest = await this.tokens.getValidAccessToken();
      response = await this.doFetch(endpoint, latest, options);
    }

    if (!response.ok) {
      const raw = sanitizeBlingErrorBody(await response.text());
      throw new BlingApiError({
        status: response.status,
        message: `Erro na API Bling (${response.status})`,
        userMessage: userMessageForBlingStatus(response.status, raw),
        retryable: response.status === 429 || response.status >= 500,
      });
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  private async doFetch(endpoint: string, accessToken: string, options: RequestOptions): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? API_TIMEOUT_MS);
    const url = `${BLING_API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    try {
      return await fetch(url, {
        ...options,
        signal: options.signal || controller.signal,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
          'enable-jwt': JWT_HEADER,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new BlingApiError({
          status: 408,
          message: 'Timeout na API Bling',
          userMessage: userMessageForBlingStatus(408),
          retryable: true,
        });
      }
      throw new BlingApiError({
        status: 502,
        message: 'Falha de rede na API Bling',
        userMessage: 'Não foi possível consultar o Bling.',
        retryable: true,
      });
    } finally {
      clearTimeout(timeout);
    }
  }
}
