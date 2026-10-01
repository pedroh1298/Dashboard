import 'server-only';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_TRACKED_CLIENTS = 10_000;

interface AttemptWindow {
  count: number;
  resetAt: number;
}

const globalRateLimit = globalThis as typeof globalThis & {
  dashboardLoginAttempts?: Map<string, AttemptWindow>;
};

const attempts = globalRateLimit.dashboardLoginAttempts ?? new Map<string, AttemptWindow>();
globalRateLimit.dashboardLoginAttempts = attempts;

function pruneExpired(now: number) {
  for (const [key, entry] of attempts) {
    if (entry.resetAt <= now) attempts.delete(key);
  }
}

export function loginClientKey(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const address = forwarded || headers.get('x-real-ip')?.trim() || 'unknown';
  return address.slice(0, 128);
}

export function checkLoginRateLimit(key: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) {
    if (attempts.size >= MAX_TRACKED_CLIENTS) pruneExpired(now);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  return {
    allowed: entry.count < MAX_ATTEMPTS,
    retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
  };
}

export function recordFailedLogin(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  current.count += 1;
}

export function clearFailedLogins(key: string) {
  attempts.delete(key);
}
