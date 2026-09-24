import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const AUTH_COOKIE_NAME = 'dashboard_session';
export const AUTH_SESSION_TTL_SECONDS = 24 * 60 * 60;

const encoder = new TextEncoder();

function getSessionSecret(): string {
  const secret = process.env.AUTH_SESSION_SECRET
    || process.env.BLING_TOKEN_ENCRYPTION_KEY
    || process.env.BLING_CLIENT_SECRET;

  if (!secret) {
    throw new Error('AUTH_SESSION_SECRET precisa estar configurado no servidor.');
  }

  return secret;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

async function sign(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(getSessionSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return toBase64Url(new Uint8Array(signature));
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return diff === 0;
}

export async function createAuthSessionValue(): Promise<string> {
  const expiresAt = Math.floor(Date.now() / 1000) + AUTH_SESSION_TTL_SECONDS;
  const payload = `admin.${expiresAt}`;
  return `${payload}.${await sign(payload)}`;
}

export async function verifyAuthSessionValue(value?: string): Promise<boolean> {
  if (!value) return false;

  const parts = value.split('.');
  if (parts.length !== 3) return false;

  const [owner, expiresRaw, receivedSignature] = parts;
  const expiresAt = Number(expiresRaw);
  if (owner !== 'admin' || !Number.isFinite(expiresAt) || expiresAt <= Date.now() / 1000) {
    return false;
  }

  try {
    const expectedSignature = await sign(`${owner}.${expiresRaw}`);
    return constantTimeEqual(receivedSignature, expectedSignature);
  } catch {
    return false;
  }
}

export function authCookieFromHeader(cookieHeader: string | null): string | undefined {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${AUTH_COOKIE_NAME}=([^;]+)`));
  return match?.[1];
}

export async function hasAuthCookie(cookieHeader: string | null): Promise<boolean> {
  return verifyAuthSessionValue(authCookieFromHeader(cookieHeader));
}

export async function isSessionAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  return verifyAuthSessionValue(jar.get(AUTH_COOKIE_NAME)?.value);
}

export function unauthorizedJson() {
  return NextResponse.json(
    { success: false, error: 'Não autenticado.' },
    { status: 401 }
  );
}