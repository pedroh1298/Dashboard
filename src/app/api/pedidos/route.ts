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
  const idsParam = searchParams.get('ids');
  const dataInicial = searchParams.get('dataInicial') || undefined;
  const dataFinal = searchParams.get('dataFinal') || undefined;
  const pageParam = searchParams.get('pagina');
  const statusParam = searchParams.get('idSituacao');
  const pagina = pageParam ? Number(pageParam) : undefined;
  const idSituacao = statusParam ? Number(statusParam) : undefined;
  const validDate = (value?: string) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value);
  const validPositiveInteger = (value?: number) => value === undefined
    || (Number.isInteger(value) && value > 0);

  const detailIds = idsParam
    ? [...new Set(idsParam.split(',').map(value => Number(value.trim())))]
    : [];

  if (
    detailIds.length > 15
    || detailIds.some(id => !Number.isInteger(id) || id <= 0)
    || !validDate(dataInicial)
    || !validDate(dataFinal)
    || !validPositiveInteger(pagina)
    || !validPositiveInteger(idSituacao)
  ) {
    return NextResponse.json(
      { success: false, error: 'Parâmetros de consulta inválidos.' },
      { status: 400 }
    );
  }

  try {
    const store = await createRequestTokenStore();
    const service = new BlingService(new BlingClient(store));
    if (idsParam) {
      const orders = await service.getOrderDetails(detailIds);
      return NextResponse.json({ success: true, orders });
    }

    const orders = pagina
      ? await service.getOrders({ dataInicial, dataFinal, pagina, idSituacao, limite: 100 })
      : await service.getAllOrders({ dataInicial, dataFinal, idSituacao, limite: 100 });
    const enrichedOrders = await service.enrichOrdersWithOperation(orders);
    return NextResponse.json({ success: true, orders: enrichedOrders });
  } catch (error: unknown) {
    const message = error instanceof BlingApiError ? error.userMessage : 'Erro ao buscar pedidos';
    console.error('[API Pedidos] Erro');
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
