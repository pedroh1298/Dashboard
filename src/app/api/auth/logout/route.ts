import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/auth';
import {
  TOKEN_AT_COOKIE_PREFIX,
  TOKEN_COOKIE_MAX_CHUNKS,
  TOKEN_META_COOKIE,
  TOKEN_RT_COOKIE_PREFIX,
} from '@/services/bling/constants';
import { OAUTH_STATE_COOKIE } from '@/services/bling/constants';

export async function GET() {
  const response = NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
  response.cookies.delete(AUTH_COOKIE_NAME);
  response.cookies.delete(OAUTH_STATE_COOKIE);
  response.cookies.delete(TOKEN_META_COOKIE);
  for (let i = 0; i < TOKEN_COOKIE_MAX_CHUNKS; i += 1) {
    response.cookies.delete(`${TOKEN_AT_COOKIE_PREFIX}${i}`);
    response.cookies.delete(`${TOKEN_RT_COOKIE_PREFIX}${i}`);
  }
  return response;
}
