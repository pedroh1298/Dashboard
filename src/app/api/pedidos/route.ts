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
  const dataInicial = searchParams.get('dataInicial') || undefined;
  const dataFinal = searchParams.get('dataFinal') || undefined;
  const pagina = searchParams.get('pagina') ? Number(searchParams.get('pagina')) : undefined;
  const idSituacao = searchParams.get('idSituacao') ? Number(searchParams.get('idSituacao')) : undefined;

  try {
    const store = await createRequestTokenStore();
    const orders = await new BlingService(new BlingClient(store)).getOrders({
      dataInicial,
      dataFinal,
      pagina,
      idSituacao,
      limite: 100,
    });
    return NextResponse.json({ success: true, orders });
  } catch (error: unknown) {
    const message = error instanceof BlingApiError ? error.userMessage : 'Erro ao buscar pedidos';
    console.error('[API Pedidos] Erro');
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
