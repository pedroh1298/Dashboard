import { NextResponse } from 'next/server';
import { isSessionAuthenticated, unauthorizedJson } from '@/lib/auth';
import { BlingClient } from '@/services/bling/blingClient';
import { BlingService } from '@/services/bling/blingService';
import { BlingApiError } from '@/services/bling/errors';
import { createRequestTokenStore } from '@/services/bling/session';

export async function GET(request: Request) {
  if (!(await isSessionAuthenticated())) {
    return unauthorizedJson();
  }

  const { searchParams } = new URL(request.url);
  const pagina = searchParams.get('pagina') ? Number(searchParams.get('pagina')) : undefined;

  try {
    const store = await createRequestTokenStore();
    const products = await new BlingService(new BlingClient(store)).getProducts({ pagina, limite: 100 });
    return NextResponse.json({ success: true, products });
  } catch (error: unknown) {
    const message = error instanceof BlingApiError ? error.userMessage : 'Erro ao buscar produtos';
    console.error('[API Produtos] Erro');
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
