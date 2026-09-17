export const BLING_API_BASE = 'https://api.bling.com.br/Api/v3';
export const BLING_AUTHORIZE_URL = 'https://www.bling.com.br/Api/v3/oauth/authorize';
export const BLING_TOKEN_URL = `${BLING_API_BASE}/oauth/token`;
export const BLING_REVOKE_URL = `${BLING_API_BASE}/oauth/revoke`;

export const JWT_HEADER = '1';
export const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;
export const OAUTH_STATE_TTL_SECONDS = 10 * 60;
export const OAUTH_STATE_COOKIE = 'bling_oauth_state';
export const TOKEN_META_COOKIE = 'bling_int_meta';
export const TOKEN_AT_COOKIE_PREFIX = 'bling_int_at_';
export const TOKEN_RT_COOKIE_PREFIX = 'bling_int_rt_';
export const TOKEN_COOKIE_MAX_CHUNKS = 8;
export const TOKEN_COOKIE_CHUNK_SIZE = 2800;
export const TOKEN_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;
export const API_TIMEOUT_MS = 15_000;
export const RATE_LIMIT_RETRY_MS = 1_000;

export const REQUIRED_SCOPES = [
  {
    key: 'order',
    label: 'Pedidos de Venda',
    reason: 'Listar e consolidar vendas no dashboard e na tela de pedidos.',
  },
  {
    key: 'product',
    label: 'Produtos',
    reason: 'Listar o catálogo, preços e saldo retornado junto aos produtos.',
  },
] as const;

export const OWNER_ID = 'admin';
