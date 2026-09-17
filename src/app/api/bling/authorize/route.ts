import { NextResponse } from 'next/server';
import { isSessionAuthenticated, unauthorizedJson } from '@/lib/auth';
import { areBlingCredentialsConfigured, buildAuthorizationUrl } from '@/services/bling/config';
import { applyOAuthStateCookie, createOAuthState } from '@/services/bling/session';

export async function GET() {
  if (!(await isSessionAuthenticated())) {
    return unauthorizedJson();
  }

  try {
    if (!areBlingCredentialsConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Credenciais do Bling não configuradas no servidor.' },
        { status: 500 }
      );
    }

    const state = createOAuthState();
    const authUrl = buildAuthorizationUrl(state);
    const response = NextResponse.redirect(authUrl);
    applyOAuthStateCookie(response, state);
    return response;
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[API Bling Authorize] Erro:', err.message);
    return NextResponse.json({ success: false, error: 'Não foi possível iniciar a autorização do Bling.' }, { status: 500 });
  }
}
