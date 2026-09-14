import { NextResponse } from 'next/server';
import { BlingTokenManager } from '@/services/bling/tokenManager';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state') || 'vortex_bling_auth';
    const authUrl = BlingTokenManager.getAuthorizationUrl(state);

    // Se a requisição veio do navegador (navegação direta), redireciona
    const acceptHeader = request.headers.get('accept') || '';
    if (acceptHeader.includes('text/html')) {
      return NextResponse.redirect(authUrl);
    }

    // Se foi chamada via fetch, retorna a URL em JSON
    return NextResponse.json({ success: true, url: authUrl });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[API Bling Authorize] Erro:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
