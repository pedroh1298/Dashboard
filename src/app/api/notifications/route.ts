import { NextResponse } from 'next/server';
import { isSessionAuthenticated, unauthorizedJson } from '@/lib/auth';
import { BlingClient } from '@/services/bling/blingClient';
import { BlingService } from '@/services/bling/blingService';
import { createRequestTokenStore } from '@/services/bling/session';
import { BlingTokenManager } from '@/services/bling/tokenManager';
import type { BlingOrder } from '@/services/bling/types';

type NotificationSeverity = 'critical' | 'warning' | 'info';
type NotificationCategory = 'orders' | 'deliveries' | 'stock' | 'integration';

interface DashboardNotification {
  id: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  title: string;
  message: string;
  href: string;
  count: number;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isOpenOrder(order: BlingOrder): boolean {
  const label = (order.situacao?.valor || '').toLowerCase();
  return order.situacao?.id === 6 || label.includes('aberto') || label.includes('andamento');
}

export async function GET() {
  if (!(await isSessionAuthenticated())) return unauthorizedJson();

  const store = await createRequestTokenStore();
  const manager = new BlingTokenManager(store);
  const connected = await manager.isConnected();

  if (!connected) {
    return NextResponse.json({
      success: true,
      connected: false,
      notifications: [{
        id: 'bling-disconnected',
        category: 'integration',
        severity: 'critical',
        title: 'Bling desconectado',
        message: 'Conecte o Bling para voltar a receber dados de pedidos e estoque.',
        href: '/configuracoes',
        count: 1,
      }] satisfies DashboardNotification[],
    });
  }

  try {
    const service = new BlingService(new BlingClient(store));
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 30);

    const [orders, products] = await Promise.all([
      service.getAllOrders({ dataInicial: isoDate(start), dataFinal: isoDate(now), limite: 100 }),
      service.getAllProducts({ limite: 100 }),
    ]);

    const today = isoDate(now);
    const openOrders = orders.filter(isOpenOrder);
    const overdue = openOrders.filter(order => order.dataPrevista && order.dataPrevista.slice(0, 10) < today);
    const dueToday = openOrders.filter(order => order.dataPrevista?.slice(0, 10) === today);
    const outOfStock = products.filter(product => (product.estoque?.saldoFisicoTotal ?? 0) <= 0);
    const lowStock = products.filter((product) => {
      const balance = product.estoque?.saldoFisicoTotal ?? 0;
      return balance > 0 && balance <= 5;
    });

    const notifications: DashboardNotification[] = [];
    if (overdue.length > 0) {
      notifications.push({
        id: `overdue-${overdue.length}`,
        category: 'deliveries',
        severity: 'critical',
        title: 'Entregas atrasadas',
        message: `${overdue.length} pedido${overdue.length === 1 ? '' : 's'} em aberto passaram da data prevista.`,
        href: '/pedidos',
        count: overdue.length,
      });
    }
    if (dueToday.length > 0) {
      notifications.push({
        id: `due-today-${dueToday.length}`,
        category: 'deliveries',
        severity: 'warning',
        title: 'Entregas previstas para hoje',
        message: `${dueToday.length} pedido${dueToday.length === 1 ? '' : 's'} ainda precisam de acompanhamento.`,
        href: '/pedidos',
        count: dueToday.length,
      });
    }
    if (openOrders.length > 0) {
      notifications.push({
        id: `open-orders-${openOrders.length}`,
        category: 'orders',
        severity: 'info',
        title: 'Pedidos em aberto',
        message: `${openOrders.length} pedido${openOrders.length === 1 ? '' : 's'} aguardam processamento nos últimos 30 dias.`,
        href: '/pedidos',
        count: openOrders.length,
      });
    }
    if (outOfStock.length > 0) {
      notifications.push({
        id: `out-of-stock-${outOfStock.length}`,
        category: 'stock',
        severity: 'critical',
        title: 'Produtos sem estoque',
        message: `${outOfStock.length} produto${outOfStock.length === 1 ? '' : 's'} estão com saldo zerado ou negativo.`,
        href: '/produtos',
        count: outOfStock.length,
      });
    }
    if (lowStock.length > 0) {
      notifications.push({
        id: `low-stock-${lowStock.length}`,
        category: 'stock',
        severity: 'warning',
        title: 'Estoque baixo',
        message: `${lowStock.length} produto${lowStock.length === 1 ? '' : 's'} têm cinco unidades ou menos.`,
        href: '/produtos',
        count: lowStock.length,
      });
    }

    return NextResponse.json({ success: true, connected: true, notifications });
  } catch (error) {
    console.error('[API Notifications] Falha ao consolidar alertas:', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({
      success: false,
      connected: true,
      notifications: [],
      error: 'Não foi possível atualizar as notificações agora.',
    }, { status: 500 });
  }
}
