import { NextResponse } from 'next/server';
import { BlingTokenManager } from '@/services/bling/tokenManager';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  const baseUrl = `${url.protocol}//${url.host}`;

  if (error) {
    console.error('[API Bling Callback] Erro retornado pelo Bling:', error, errorDescription);
    return NextResponse.redirect(new URL(`/?bling_error=${encodeURIComponent(errorDescription || error)}`, baseUrl));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?bling_error=Código de autorização não fornecido pelo Bling', baseUrl));
  }

  try {
    console.log('[API Bling Callback] Código recebido. Trocando por tokens...');
    await BlingTokenManager.exchangeCodeForTokens(code);
    console.log('[API Bling Callback] Tokens obtidos e armazenados com sucesso!');

    return NextResponse.redirect(new URL('/?bling_connected=true', baseUrl));
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[API Bling Callback] Erro ao trocar código:', err);
    return NextResponse.redirect(new URL(`/?bling_error=${encodeURIComponent(err.message || 'Erro ao validar credenciais')}`, baseUrl));
  }
}
