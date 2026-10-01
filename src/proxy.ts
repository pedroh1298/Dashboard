import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { hasAuthCookie } from '@/lib/auth';

function buildContentSecurityPolicy(nonce: string): string {
  const isDevelopment = process.env.NODE_ENV === 'development';
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDevelopment ? " 'unsafe-eval'" : ''}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' blob: data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.bling.com.br https://generativelanguage.googleapis.com https://*.supabase.co",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDevelopment ? [] : ['upgrade-insecure-requests']),
  ].join('; ');
}

function applyCsp(response: NextResponse, csp: string): NextResponse {
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  return response;
}

function continueRequest(request: NextRequest, nonce: string, csp: string): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);
  return applyCsp(
    NextResponse.next({ request: { headers: requestHeaders } }),
    csp
  );
}

export async function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = buildContentSecurityPolicy(nonce);
  const isAuth = await hasAuthCookie(request.headers.get('cookie'));
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === '/login';
  const isBlingCallback = pathname === '/api/bling/callback';

  if (isBlingCallback) {
    return continueRequest(request, nonce, csp);
  }

  if (pathname.startsWith('/api/')) {
    if (!isAuth) {
      return applyCsp(
        NextResponse.json({ success: false, error: 'Não autenticado.' }, { status: 401 }),
        csp
      );
    }
    return continueRequest(request, nonce, csp);
  }

  if (!isAuth && !isLoginPage) {
    return applyCsp(NextResponse.redirect(new URL('/login', request.url)), csp);
  }

  if (isAuth && isLoginPage) {
    return applyCsp(NextResponse.redirect(new URL('/', request.url)), csp);
  }

  return continueRequest(request, nonce, csp);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
