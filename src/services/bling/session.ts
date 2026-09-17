import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';
import { OAUTH_STATE_COOKIE, OAUTH_STATE_TTL_SECONDS } from './constants';
import { CookieTokenStore, type TokenStore } from './tokenStore';

function stateCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: OAUTH_STATE_TTL_SECONDS,
  };
}

export function createOAuthState(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString('base64url');
}

export function applyOAuthStateCookie(response: NextResponse, state: string) {
  response.cookies.set(OAUTH_STATE_COOKIE, state, stateCookieOptions());
}

export function clearOAuthStateCookie(response: NextResponse) {
  response.cookies.delete(OAUTH_STATE_COOKIE);
}

export async function getRequestOAuthState(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(OAUTH_STATE_COOKIE)?.value;
}

export async function createRequestTokenStore(): Promise<TokenStore> {
  const jar = await cookies();
  return new CookieTokenStore(jar);
}

export function createResponseTokenStore(response: NextResponse): TokenStore {
  return new CookieTokenStore(response.cookies);
}
