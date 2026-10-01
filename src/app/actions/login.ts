"use server"

import { cookies, headers } from 'next/headers'
import {
  AUTH_COOKIE_NAME,
  authCookieOptions,
  createAuthSessionValue,
} from '@/lib/auth'
import {
  checkLoginRateLimit,
  clearFailedLogins,
  loginClientKey,
  recordFailedLogin,
} from '@/lib/loginRateLimit'

const ADMIN_USERNAME = 'ADMIN'

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(new ArrayBuffer(binary.length))
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index]
  }
  return difference === 0
}

async function verifyAdminCredentials(username: string, password: string): Promise<boolean> {
  const salt = process.env.DASHBOARD_PASSWORD_SALT?.trim()
  const expectedHash = process.env.DASHBOARD_PASSWORD_HASH?.trim()
  const iterations = Number(process.env.DASHBOARD_PASSWORD_ITERATIONS || 600_000)
  if (
    !salt
    || !expectedHash
    || !Number.isInteger(iterations)
    || iterations < 600_000
  ) {
    console.error('[Auth] Verificador da senha ADMIN não configurado no servidor.')
    return false
  }

  const boundedPassword = password.slice(0, 256)
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(boundedPassword),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: fromBase64Url(salt),
      iterations,
    },
    key,
    256
  )

  return username === ADMIN_USERNAME
    && password.length > 0
    && password.length <= 256
    && constantTimeEqual(new Uint8Array(derived), fromBase64Url(expectedHash))
}

export async function loginAction(formData: FormData) {
  const username = String(formData.get('username') || '').trim().slice(0, 64)
  const password = String(formData.get('password') || '')
  const requestHeaders = await headers()
  const clientKey = loginClientKey(requestHeaders)
  const rateLimit = checkLoginRateLimit(clientKey)

  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Muitas tentativas. Aguarde ${Math.ceil(rateLimit.retryAfterSeconds / 60)} minuto(s).`,
    }
  }

  const validCredentials = await verifyAdminCredentials(username, password)

  if (validCredentials) {
    clearFailedLogins(clientKey)
    const cookieJar = await cookies()
    cookieJar.set(
      AUTH_COOKIE_NAME,
      await createAuthSessionValue(),
      authCookieOptions()
    )
    return { success: true }
  }

  recordFailedLogin(clientKey)
  return { success: false, error: 'Usuário ou senha incorretos' }
}
