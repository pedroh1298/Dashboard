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
  const pageParam = searchParams.get('pagina');
  const parsedPage = pageParam ? Number(pageParam) : undefined;
  if (parsedPage !== undefined && (!Number.isInteger(parsedPage) || parsedPage < 1 || parsedPage > 100)) {
    return NextResponse.json(
      { success: false, error: 'Página inválida.' },
      { status: 400 }
    );
  }
  const pagina = parsedPage;

  try {
    const store = await createRequestTokenStore();
    const service = new BlingService(new BlingClient(store));
    const products = pagina
      ? await service.getProducts({ pagina, limite: 100 })
      : await service.getAllProducts({ limite: 100 });

    return NextResponse.json({
      success: true,
      products,
      total: products.length,
    });
  } catch (error: unknown) {
    const message = error instanceof BlingApiError ? error.userMessage : 'Erro ao buscar produtos';
    console.error('[API Produtos] Erro');
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
