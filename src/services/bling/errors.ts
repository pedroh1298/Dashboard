export class BlingApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly userMessage: string;
  readonly retryable: boolean;

  constructor(options: {
    message: string;
    status: number;
    code?: string;
    userMessage?: string;
    retryable?: boolean;
  }) {
    super(options.message);
    this.name = 'BlingApiError';
    this.status = options.status;
    this.code = options.code;
    this.userMessage = options.userMessage || options.message;
    this.retryable = options.retryable ?? false;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BlingApiError);
    }
  }
}

export function userMessageForBlingStatus(status: number, bodySnippet?: string): string {
  if (status === 401) {
    return 'Sessão do Bling expirada ou inválida. Reconecte sua conta.';
  }
  if (status === 403) {
    return 'Permissão insuficiente no Bling. No cadastro do aplicativo, mantenha somente os escopos Pedidos de Venda e Produtos e autorize novamente com um usuário administrador.';
  }
  if (status === 429) {
    return 'O Bling limitou as requisições no momento. Aguarde alguns segundos e tente de novo.';
  }
  if (status >= 500) {
    return 'O Bling está indisponível no momento. Tente novamente em instantes.';
  }
  if (status === 408) {
    return 'A comunicação com o Bling excedeu o tempo limite.';
  }
  if (bodySnippet && /token/i.test(bodySnippet) && /n[aã]o autorizado|unauthorized|forbidden/i.test(bodySnippet)) {
    return 'Permissão insuficiente no Bling. Mantenha somente os escopos Pedidos de Venda e Produtos e reconecte o aplicativo.';
  }
  return 'Não foi possível consultar o Bling.';
}

export function sanitizeBlingErrorBody(text: string): string {
  return text
    .replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, 'Bearer [redacted]')
    .replace(/access_token"\s*:\s*"[^"]+"/gi, 'access_token":"[redacted]"')
    .replace(/refresh_token"\s*:\s*"[^"]+"/gi, 'refresh_token":"[redacted]"')
    .slice(0, 400);
}
