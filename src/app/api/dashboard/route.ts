import { NextResponse } from 'next/server';
import { BlingService } from '@/services/bling/blingService';

export async function GET() {
  try {
    const dashboardData = await BlingService.getDashboardData();

    return NextResponse.json({
      success: true,
      ...dashboardData,
    });
  } catch (error: any) {
    console.error('[API Dashboard] Erro:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao carregar dados do dashboard',
      },
      { status: 500 }
    );
  }
}
