"use server"

import { cookies } from 'next/headers'

export async function loginAction(formData: FormData) {
  const username = formData.get('username')
  const password = formData.get('password')

  // Verificação hardcoded solicitada
  if (username === 'ADMIN' && password === 'adminteste1234') {
    (await cookies()).set('is_authenticated', 'true', { 
      path: '/', 
      maxAge: 86400,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    });
    return { success: true }
  }
  
  return { success: false, error: 'Usuário ou senha incorretos' }
}
