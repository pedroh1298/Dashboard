import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isAuth = request.cookies.get('is_authenticated')?.value;
  const isLoginPage = request.nextUrl.pathname === '/login';

  // Se não estiver logado e não for a página de login, redireciona para o login
  if (!isAuth && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Se estiver logado e tentar acessar a página de login, redireciona para o dashboard
  if (isAuth && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Configura o middleware para rodar em todas as rotas, exceto arquivos estáticos
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
