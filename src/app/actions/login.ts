"use server"

import { cookies } from 'next/headers'
import {
  AUTH_COOKIE_NAME,
  AUTH_SESSION_TTL_SECONDS,
  createAuthSessionValue,
} from '@/lib/auth'

export async function loginAction(formData: FormData) {
  const username = String(formData.get('username') || '')
  const password = String(formData.get('password') || '')
  const expectedUsername = process.env.DASHBOARD_USERNAME
  const expectedPassword = process.env.DASHBOARD_PASSWORD

  if (!expectedUsername || !expectedPassword) {
    return { success: false, error: 'Login do painel não configurado no servidor.' }
  }

  if (username === expectedUsername && password === expectedPassword) {
    (await cookies()).set(AUTH_COOKIE_NAME, await createAuthSessionValue(), {
      path: '/',
      maxAge: AUTH_SESSION_TTL_SECONDS,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })
    return { success: true }
  }

  return { success: false, error: 'Usuário ou senha incorretos' }
}