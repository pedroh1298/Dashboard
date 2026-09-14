import { NextResponse } from 'next/server';
import { BlingService } from '@/services/bling/blingService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pagina = searchParams.get('pagina') ? Number(searchParams.get('pagina')) : undefined;

  try {
    const products = await BlingService.getProducts({ pagina, limite: 100 });
    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    console.error('[API Produtos] Erro:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
