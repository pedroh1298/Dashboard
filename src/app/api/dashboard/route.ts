import { NextResponse } from 'next/server';
import { isSessionAuthenticated, unauthorizedJson } from '@/lib/auth';
import { BlingClient } from '@/services/bling/blingClient';
import { BlingService } from '@/services/bling/blingService';
import { BlingApiError } from '@/services/bling/errors';
import { createRequestTokenStore } from '@/services/bling/session';
import { getBlingTokenStorageMode } from '@/services/bling/supabaseTokenStore';

export async function GET(request: Request) {
  if (!(await isSessionAuthenticated())) {
    return unauthorizedJson();
  }

  try {
    const store = await createRequestTokenStore();
    const forceRefresh = new URL(request.url).searchParams.get('refresh') === '1';
    const dashboardData = await new BlingService(new BlingClient(store)).getDashboardData(forceRefresh);
    return NextResponse.json({
      success: true,
      tokenStorage: getBlingTokenStorageMode(),
      ...dashboardData,
    });
  } catch (error: unknown) {
    const message = error instanceof BlingApiError
      ? error.userMessage
      : 'Erro ao carregar dados do dashboard';
    console.error('[API Dashboard] Erro');
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
