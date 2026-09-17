import {
  BLING_REVOKE_URL,
  BLING_TOKEN_URL,
  JWT_HEADER,
} from './constants';
import { getBasicAuthHeader } from './config';
import { BlingApiError, sanitizeBlingErrorBody, userMessageForBlingStatus } from './errors';
import type { BlingTokenData } from './types';

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type?: string;
  scope?: string;
}

async function requestToken(body: URLSearchParams): Promise<BlingTokenData> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(BLING_TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: getBasicAuthHeader(),
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        'enable-jwt': JWT_HEADER,
      },
      body: body.toString(),
      signal: controller.signal,
    });

    const raw = await response.text();
    if (!response.ok) {
      throw new BlingApiError({
        status: response.status,
        message: `Falha ao obter token do Bling (${response.status})`,
        userMessage: userMessageForBlingStatus(response.status, raw),
      });
    }

    const data = JSON.parse(raw) as TokenResponse;
    if (!data.access_token) {
      throw new BlingApiError({
        status: 502,
        message: 'Resposta de token do Bling sem access_token',
        userMessage: 'Não foi possível conectar ao Bling.',
      });
    }

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token || '',
      expires_in: Number(data.expires_in) || 21600,
      token_type: data.token_type || 'Bearer',
      scope: data.scope,
      expires_at: Date.now() + (Number(data.expires_in) || 21600) * 1000,
    };
  } catch (error) {
    if (error instanceof BlingApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new BlingApiError({
        status: 408,
        message: 'Timeout na troca de token do Bling',
        userMessage: userMessageForBlingStatus(408),
        retryable: true,
      });
    }
    throw new BlingApiError({
      status: 502,
      message: 'Falha de comunicação na troca de token do Bling',
      userMessage: 'Não foi possível conectar ao Bling.',
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function exchangeAuthorizationCode(code: string): Promise<BlingTokenData> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code.trim(),
  });
  return requestToken(body);
}

export async function refreshBlingTokens(refreshToken: string): Promise<BlingTokenData> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });
  return requestToken(body);
}

export async function revokeBlingToken(token: string): Promise<void> {
  if (!token) return;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    await fetch(BLING_REVOKE_URL, {
      method: 'POST',
      headers: {
        Authorization: getBasicAuthHeader(),
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        'enable-jwt': JWT_HEADER,
      },
      body: new URLSearchParams({ token }).toString(),
      signal: controller.signal,
    });
  } catch (error) {
    const safe = error instanceof Error ? error.name : 'unknown';
    console.warn('[BlingOAuth] Falha ao revogar token:', safe);
  } finally {
    clearTimeout(timeout);
  }
}

export function extractAuthorizationCode(input: string): string {
  const value = input.trim();
  if (value.includes('code=')) {
    try {
      const maybeUrl = value.includes('://') ? new URL(value) : new URL(`https://placeholder.local/?${value.replace(/^[?]/, '')}`);
      const code = maybeUrl.searchParams.get('code');
      if (code) return code;
    } catch {
      const match = value.match(/[?&]code=([^&#]+)/);
      if (match?.[1]) return decodeURIComponent(match[1]);
    }
  }
  return value;
}

export function describeOAuthCallbackError(error?: string | null, description?: string | null): {
  code: string;
  message: string;
} {
  void description;
  if (error === 'access_denied') {
    return {
      code: 'denied',
      message: 'A autorização no Bling foi cancelada. Você pode tentar novamente quando quiser.',
    };
  }
  return {
    code: 'oauth',
    message: 'Não foi possível conectar ao Bling.',
  };
}

export function safeOAuthLogDetails(status?: number, body?: string) {
  return {
    status: status ?? null,
    body: body ? sanitizeBlingErrorBody(body) : null,
  };
}
