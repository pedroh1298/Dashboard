import { NextResponse } from 'next/server';
import { BlingApiError } from '@/services/bling/errors';
import { describeOAuthCallbackError, extractAuthorizationCode } from '@/services/bling/oauth';
import {
  clearOAuthStateCookie,
  createResponseTokenStore,
  getRequestOAuthState,
} from '@/services/bling/session';
import { timingSafeEqual } from '@/services/bling/crypto';
import { BlingTokenManager } from '@/services/bling/tokenManager';

function redirectHome(requestUrl: string, params: Record<string, string>) {
  const url = new URL(requestUrl);
  const target = new URL('/', `${url.protocol}//${url.host}`);
  Object.entries(params).forEach(([key, value]) => target.searchParams.set(key, value));
  return NextResponse.redirect(target);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const codeParam = url.searchParams.get('code');
  const stateParam = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  if (error) {
    const mapped = describeOAuthCallbackError(error, errorDescription);
    const response = redirectHome(request.url, {
      bling_error: mapped.code,
      bling_message: mapped.message,
    });
    clearOAuthStateCookie(response);
    return response;
  }

  const expectedState = await getRequestOAuthState();
  if (!expectedState || !stateParam || !timingSafeEqual(expectedState, stateParam)) {
    const response = redirectHome(request.url, {
      bling_error: 'invalid_state',
      bling_message: 'Não foi possível conectar ao Bling. A validação de segurança falhou. Tente autorizar novamente.',
    });
    clearOAuthStateCookie(response);
    return response;
  }

  if (!codeParam) {
    const response = redirectHome(request.url, {
      bling_error: 'missing_code',
      bling_message: 'Não foi possível conectar ao Bling. O código de autorização não foi retornado.',
    });
    clearOAuthStateCookie(response);
    return response;
  }

  const response = redirectHome(request.url, { bling_connected: 'true' });
  clearOAuthStateCookie(response);

  try {
    const code = extractAuthorizationCode(codeParam);
    const store = createResponseTokenStore(response);
    const manager = new BlingTokenManager(store);
    await manager.exchangeCodeForTokens(code);
    return response;
  } catch (error: unknown) {
    const userMessage = error instanceof BlingApiError
      ? error.userMessage
      : 'Não foi possível conectar ao Bling.';
    console.error('[API Bling Callback] Falha na troca de token:', error instanceof BlingApiError ? error.status : 'unknown');
    return redirectHome(request.url, {
      bling_error: 'token',
      bling_message: userMessage,
    });
  }
}
