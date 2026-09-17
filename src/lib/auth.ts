import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const AUTH_COOKIE_NAME = 'is_authenticated';

export function hasAuthCookie(cookieHeader: string | null): boolean {
  if (!cookieHeader) return false;
  return /(?:^|;\s*)is_authenticated=true(?:;|$)/.test(cookieHeader);
}

export async function isSessionAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(AUTH_COOKIE_NAME)?.value === 'true';
}

export function unauthorizedJson() {
  return NextResponse.json(
    { success: false, error: 'Não autenticado.' },
    { status: 401 }
  );
}
