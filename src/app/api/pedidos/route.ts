import { NextResponse } from 'next/server';
import { BlingService } from '@/services/bling/blingService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dataInicial = searchParams.get('dataInicial') || undefined;
  const dataFinal = searchParams.get('dataFinal') || undefined;
  const pagina = searchParams.get('pagina') ? Number(searchParams.get('pagina')) : undefined;
  const idSituacao = searchParams.get('idSituacao') ? Number(searchParams.get('idSituacao')) : undefined;

  try {
    const orders = await BlingService.getOrders({ dataInicial, dataFinal, pagina, idSituacao, limite: 100 });
    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    console.error('[API Pedidos] Erro:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
