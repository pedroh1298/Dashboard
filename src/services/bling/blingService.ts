import { BlingClient } from './blingClient';
import { BlingApiError } from './errors';
import {
  BlingOrder,
  BlingOrdersResponse,
  BlingProduct,
  BlingProductsResponse,
  DashboardData,
  DashboardMetrics,
  DashboardSalesPoint,
} from './types';

const MAX_PAGES = 5;

export class BlingService {
  constructor(private readonly client: BlingClient) {}

  async getOrders(params?: {
    dataInicial?: string;
    dataFinal?: string;
    pagina?: number;
    limite?: number;
    idSituacao?: number;
  }): Promise<BlingOrder[]> {
    const query = new URLSearchParams();
    if (params?.dataInicial) query.append('dataInicial', params.dataInicial);
    if (params?.dataFinal) query.append('dataFinal', params.dataFinal);
    if (params?.pagina) query.append('pagina', params.pagina.toString());
    query.append('limite', (params?.limite || 100).toString());
    if (params?.idSituacao) query.append('idSituacao', params.idSituacao.toString());

    const result = await this.client.get<BlingOrdersResponse>(`/pedidos/vendas?${query.toString()}`);
    return result.data || [];
  }

  async getAllOrders(params?: {
    dataInicial?: string;
    dataFinal?: string;
    limite?: number;
    idSituacao?: number;
  }): Promise<BlingOrder[]> {
    const orders: BlingOrder[] = [];
    for (let pagina = 1; pagina <= MAX_PAGES; pagina += 1) {
      const page = await this.getOrders({ ...params, pagina });
      orders.push(...page);
      if (page.length < (params?.limite || 100)) break;
    }
    return orders;
  }

  async getProducts(params?: {
    pagina?: number;
    limite?: number;
  }): Promise<BlingProduct[]> {
    const query = new URLSearchParams();
    if (params?.pagina) query.append('pagina', params.pagina.toString());
    query.append('limite', (params?.limite || 100).toString());
    const result = await this.client.get<BlingProductsResponse>(`/produtos?${query.toString()}`);
    return result.data || [];
  }

  async probeConnection(): Promise<{ ok: boolean; resource: string; error?: string }> {
    try {
      await this.client.get<BlingProductsResponse>('/produtos?limite=1');
      return { ok: true, resource: 'produtos' };
    } catch (error) {
      const err = error instanceof BlingApiError ? error : null;
      return {
        ok: false,
        resource: 'produtos',
        error: err?.userMessage || 'Não foi possível consultar o Bling.',
      };
    }
  }

  async getDashboardData(): Promise<DashboardData> {
    const connected = await this.client.tokenManager.isConnected();
    if (!connected) {
      return {
        connected: false,
        metrics: emptyMetrics(),
        salesData: [],
        message: 'Bling ERP não conectado. Clique em "Conectar Bling" para integrar suas vendas.',
      };
    }

    try {
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(now.getDate() - 60);
      const formatDate = (d: Date) => d.toISOString().split('T')[0];

      const currentOrders = await this.getAllOrders({
        dataInicial: formatDate(thirtyDaysAgo),
        dataFinal: formatDate(now),
        limite: 100,
      });

      const previousOrders = await this.getAllOrders({
        dataInicial: formatDate(sixtyDaysAgo),
        dataFinal: formatDate(thirtyDaysAgo),
        limite: 100,
      }).catch(() => [] as BlingOrder[]);

      const faturamentoAtual = currentOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
      const pedidosAtual = currentOrders.length;
      const ticketMedioAtual = pedidosAtual > 0 ? faturamentoAtual / pedidosAtual : 0;
      const lucroAtual = faturamentoAtual * 0.22;

      const faturamentoAnterior = previousOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
      const pedidosAnterior = previousOrders.length;
      const ticketMedioAnterior = pedidosAnterior > 0 ? faturamentoAnterior / pedidosAnterior : 0;
      const lucroAnterior = faturamentoAnterior * 0.22;

      const calcTrend = (current: number, prev: number): number => {
        if (prev === 0) return current > 0 ? 100 : 0;
        return Number((((current - prev) / prev) * 100).toFixed(1));
      };

      const metrics: DashboardMetrics = {
        faturamento: faturamentoAtual,
        lucro: lucroAtual,
        pedidos: pedidosAtual,
        ticketMedio: ticketMedioAtual,
        faturamentoTrend: calcTrend(faturamentoAtual, faturamentoAnterior),
        lucroTrend: calcTrend(lucroAtual, lucroAnterior),
        pedidosTrend: calcTrend(pedidosAtual, pedidosAnterior),
        ticketTrend: calcTrend(ticketMedioAtual, ticketMedioAnterior),
      };

      const salesMap = new Map<string, { ML: number; Amazon: number; Outros: number }>();
      const last14Days: string[] = [];

      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dayKey = d.toISOString().split('T')[0];
        last14Days.push(dayKey);
        salesMap.set(dayKey, { ML: 0, Amazon: 0, Outros: 0 });
      }

      currentOrders.forEach((order) => {
        const orderDate = order.data ? order.data.substring(0, 10) : '';
        if (salesMap.has(orderDate)) {
          const entry = salesMap.get(orderDate)!;
          const val = Number(order.total) || 0;
          const numLoja = (order.numeroLoja || '').toLowerCase();
          if (numLoja.includes('ml') || numLoja.includes('mercado') || (order.loja?.id && order.loja.id % 2 === 0)) {
            entry.ML += val;
          } else if (numLoja.includes('amz') || numLoja.includes('amazon')) {
            entry.Amazon += val;
          } else {
            entry.ML += val * 0.65;
            entry.Amazon += val * 0.35;
          }
        }
      });

      const salesData: DashboardSalesPoint[] = last14Days.map((dayKey) => {
        const entry = salesMap.get(dayKey)!;
        const [, month, day] = dayKey.split('-');
        return {
          name: `${day}/${month}`,
          ML: Math.round(entry.ML),
          Amazon: Math.round(entry.Amazon),
          Total: Math.round(entry.ML + entry.Amazon + entry.Outros),
        };
      });

      return {
        connected: true,
        metrics,
        salesData,
        recentOrders: currentOrders.slice(0, 5),
      };
    } catch (error: unknown) {
      if (error instanceof BlingApiError && error.status === 403) {
        return {
          connected: true,
          metrics: emptyMetrics(),
          salesData: [],
          message: error.userMessage,
        };
      }

      const message = error instanceof BlingApiError
        ? error.userMessage
        : 'Erro ao sincronizar dados com o Bling.';
      console.error('[BlingService] Falha ao compilar dados do dashboard:', error instanceof Error ? error.message : 'unknown');
      return {
        connected: false,
        metrics: emptyMetrics(),
        salesData: [],
        message,
      };
    }
  }
}

function emptyMetrics(): DashboardMetrics {
  return {
    faturamento: 0,
    lucro: 0,
    pedidos: 0,
    ticketMedio: 0,
    faturamentoTrend: 0,
    lucroTrend: 0,
    pedidosTrend: 0,
    ticketTrend: 0,
  };
}
