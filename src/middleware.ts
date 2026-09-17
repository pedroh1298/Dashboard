import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { hasAuthCookie } from '@/lib/auth';

export function middleware(request: NextRequest) {
  const isAuth = hasAuthCookie(request.headers.get('cookie'));
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === '/login';
  const isBlingCallback = pathname === '/api/bling/callback';

  if (isBlingCallback) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    if (!isAuth) {
      return NextResponse.json({ success: false, error: 'Não autenticado.' }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (!isAuth && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuth && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
