"use server"

import { cookies } from 'next/headers'
import {
  AUTH_COOKIE_NAME,
  AUTH_SESSION_TTL_SECONDS,
  createAuthSessionValue,
} from '@/lib/auth'

const FALLBACK_USERNAME = 'ADMIN'
const FALLBACK_PASSWORD_SALT = 'D3T_KIz7bnsd_NiotWLZNQ'
const FALLBACK_PASSWORD_HASH = 'sSFcf8TBM7oyR8yPPdWBte8xrOssx-nGkerq-wzRFok'
const FALLBACK_PASSWORD_ITERATIONS = 210_000

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

async function verifyFallbackCredentials(username: string, password: string): Promise<boolean> {
  if (username !== FALLBACK_USERNAME || !password) return false

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: fromBase64Url(FALLBACK_PASSWORD_SALT),
      iterations: FALLBACK_PASSWORD_ITERATIONS,
    },
    key,
    256
  )

  return constantTimeEqual(
    new Uint8Array(derived),
    fromBase64Url(FALLBACK_PASSWORD_HASH)
  )
}

export async function loginAction(formData: FormData) {
  const username = String(formData.get('username') || '')
  const password = String(formData.get('password') || '')
  const expectedUsername = process.env.DASHBOARD_USERNAME
  const expectedPassword = process.env.DASHBOARD_PASSWORD

  const validCredentials = expectedUsername && expectedPassword
    ? username === expectedUsername && password === expectedPassword
    : await verifyFallbackCredentials(username, password)

  if (validCredentials) {
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