import { NextResponse } from 'next/server';
import { isSessionAuthenticated, unauthorizedJson } from '@/lib/auth';
import { BlingClient } from '@/services/bling/blingClient';
import { BlingService } from '@/services/bling/blingService';
import { areBlingCredentialsConfigured, getBlingRedirectUri, parseScopeList } from '@/services/bling/config';
import { REQUIRED_SCOPES } from '@/services/bling/constants';
import { BlingApiError } from '@/services/bling/errors';
import { extractAuthorizationCode } from '@/services/bling/oauth';
import { createRequestTokenStore } from '@/services/bling/session';
import { BlingTokenManager } from '@/services/bling/tokenManager';

function publicStatus(record: Awaited<ReturnType<BlingTokenManager['getRecord']>>) {
  if (!record) {
    return {
      connected: false,
      status: 'disconnected' as const,
      expiresAt: null as string | null,
      scopes: [] as string[],
    };
  }

  const expired = Date.now() >= record.expires_at;
  return {
    connected: true,
    status: expired ? 'expired' as const : record.status,
    expiresAt: new Date(record.expires_at).toISOString(),
    scopes: parseScopeList(record.scope),
  };
}

export async function GET() {
  if (!(await isSessionAuthenticated())) {
    return unauthorizedJson();
  }

  const store = await createRequestTokenStore();
  const manager = new BlingTokenManager(store);
  const record = await manager.getRecord();
  const base = {
    ...publicStatus(record),
    credentialsConfigured: areBlingCredentialsConfigured(),
    redirectUri: getBlingRedirectUri(),
    requiredScopes: REQUIRED_SCOPES,
  };

  if (!record?.access_token) {
    return NextResponse.json(base);
  }

  try {
    const client = new BlingClient(store);
    const service = new BlingService(client);
    const probe = await service.probeConnection();
    return NextResponse.json({
      ...base,
      ...publicStatus(await manager.getRecord()),
      probe,
    });
  } catch (error: unknown) {
    const message = error instanceof BlingApiError ? error.userMessage : 'Não foi possível consultar o Bling.';
    return NextResponse.json({
      ...base,
      probe: { ok: false, resource: 'produtos', error: message },
    });
  }
}

export async function DELETE() {
  if (!(await isSessionAuthenticated())) {
    return unauthorizedJson();
  }

  const store = await createRequestTokenStore();
  const manager = new BlingTokenManager(store);
  await manager.disconnect();
  return NextResponse.json({ success: true, message: 'Bling desconectado com sucesso.' });
}

export async function POST(request: Request) {
  if (!(await isSessionAuthenticated())) {
    return unauthorizedJson();
  }

  try {
    const body = await request.json();
    if (!body.code) {
      return NextResponse.json({
        success: false,
        error: 'Informe o código de autorização retornado pelo Bling.',
      }, { status: 400 });
    }

    const store = await createRequestTokenStore();
    const manager = new BlingTokenManager(store);
    await manager.exchangeCodeForTokens(extractAuthorizationCode(String(body.code)));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof BlingApiError
      ? error.userMessage
      : 'Não foi possível conectar ao Bling.';
    console.error('[API Bling Status POST] Falha na autorização');
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
