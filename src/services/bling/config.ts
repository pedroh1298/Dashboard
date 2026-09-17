import { BLING_AUTHORIZE_URL } from './constants';

export function getBlingClientId(): string {
  const id = process.env.BLING_CLIENT_ID?.trim();
  if (!id) {
    throw new Error('BLING_CLIENT_ID não está configurado nas variáveis de ambiente.');
  }
  return id;
}

export function getBlingClientSecret(): string {
  const secret = process.env.BLING_CLIENT_SECRET?.trim();
  if (!secret) {
    throw new Error('BLING_CLIENT_SECRET não está configurado nas variáveis de ambiente.');
  }
  return secret;
}

export function getBlingRedirectUri(): string {
  const explicit = process.env.BLING_REDIRECT_URI?.trim();
  if (explicit) return explicit;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) {
    return `${appUrl.replace(/\/$/, '')}/api/bling/callback`;
  }

  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (productionHost) {
    return `https://${productionHost.replace(/\/$/, '')}/api/bling/callback`;
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/$/, '')}/api/bling/callback`;
  }

  return 'http://localhost:3000/api/bling/callback';
}

export function getBasicAuthHeader(): string {
  const credentials = `${getBlingClientId()}:${getBlingClientSecret()}`;
  return `Basic ${Buffer.from(credentials).toString('base64')}`;
}

export function buildAuthorizationUrl(state: string, clientId = getBlingClientId()): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    state,
  });
  return `${BLING_AUTHORIZE_URL}?${params.toString()}`;
}

export function parseScopeList(scope?: string | null): string[] {
  if (!scope) return [];
  return scope
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function areBlingCredentialsConfigured(): boolean {
  return Boolean(process.env.BLING_CLIENT_ID?.trim() && process.env.BLING_CLIENT_SECRET?.trim());
}
