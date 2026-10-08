import { BlingClient } from './blingClient';
import { BlingApiError } from './errors';
import {
  BlingOrder,
  BlingOrderOperation,
  BlingOrderResponse,
  BlingOrdersResponse,
  BlingProduct,
  BlingProductsResponse,
  BlingSalesChannel,
  BlingSalesChannelResponse,
  BlingSalesChannelsResponse,
  BlingWarehouse,
  BlingWarehousesResponse,
  DashboardData,
  DashboardMetrics,
  DashboardSalesPoint,
} from './types';

const MAX_ORDER_PAGES = 5;
const MAX_PRODUCT_PAGES = 100;
const OPERATION_CACHE_TTL_MS = 5 * 60 * 1000;
const ORDER_LIST_CACHE_TTL_MS = 45 * 1000;
const PRODUCT_LIST_CACHE_TTL_MS = 2 * 60 * 1000;

let warehouseCache: { expiresAt: number; data: BlingWarehouse[] } | null = null;
let salesChannelsCache: { expiresAt: number; data: BlingSalesChannel[] } | null = null;
const channelCache = new Map<number, { expiresAt: number; data: BlingSalesChannel }>();
const orderDetailCache = new Map<number, { expiresAt: number; data: BlingOrder }>();
const orderListCache = new Map<string, { expiresAt: number; data?: BlingOrder[]; pending?: Promise<BlingOrder[]> }>();
let productListCache: { expiresAt: number; data?: BlingProduct[]; pending?: Promise<BlingProduct[]> } | null = null;

function normalizeLabel(value?: string): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

type MarketplaceName = 'Amazon' | 'Mercado Livre';
type MarketplaceLabel = MarketplaceName | 'Não identificado';

function marketplaceFromText(...values: Array<string | undefined>): MarketplaceName | undefined {
  const normalized = normalizeLabel(values.filter(Boolean).join(' ')).replace(/[^a-z0-9]/g, '');
  if (normalized.includes('amazon') || normalized.includes('amz')) return 'Amazon';
  if (normalized.includes('mercadolivre') || normalized.includes('meli')) return 'Mercado Livre';
  return undefined;
}

function inferMarketplaceFromOrderNumber(value?: string): MarketplaceName | undefined {
  const orderNumber = (value || '').trim();
  if (/\b\d{3}[-\s]\d{7}[-\s]\d{7}\b/.test(orderNumber)) return 'Amazon';
  if (/^2\d{14,16}$/.test(orderNumber)) return 'Mercado Livre';
  return marketplaceFromText(orderNumber);
}

function marketplaceFromOrder(order: BlingOrder): MarketplaceName | undefined {
  const textEvidence = marketplaceFromText(
    order.intermediador?.nomeUsuario,
    order.observacoes,
    order.observacoesInternas,
    order.numeroPedidoCompra,
    order.transporte?.servico,
    order.transporte?.modalidade,
    order.transporte?.contato?.nome,
    order.transporte?.transportador?.nome,
    order.transporte?.logistica?.nome,
    ...(order.parcelas || []).flatMap(parcela => [parcela.observacoes, parcela.caut]),
    ...(order.transporte?.volumes || []).map(volume => volume.servico)
  );
  if (textEvidence) return textEvidence;

  const numberEvidence = [
    order.numeroLoja,
    order.numeroPedidoCompra,
    ...(order.parcelas || []).map(parcela => parcela.observacoes),
  ].map(inferMarketplaceFromOrderNumber).find(Boolean);
  return numberEvidence;
}

function marketplaceLabel(type?: string, storeName?: string, externalOrderNumber?: string, inferred?: MarketplaceName): MarketplaceLabel {
  return inferred
    || marketplaceFromText(type, storeName)
    || inferMarketplaceFromOrderNumber(externalOrderNumber)
    || 'Não identificado';
}

function containsFullSignal(...values: Array<string | undefined>): boolean {
  const text = normalizeLabel(values.filter(Boolean).join(' '));
  return /(^|\W)(full|fulfillment)($|\W)/.test(text);
}

function orderFullSignal(order: BlingOrder): boolean {
  return containsFullSignal(
    order.observacoes,
    order.observacoesInternas,
    ...(order.transporte?.volumes || []).map(volume => volume.servico)
  );
}

function shippingSignals(order: BlingOrder): string[] {
  return [
    order.transporte?.servico,
    order.transporte?.modalidade,
    order.transporte?.contato?.nome,
    order.transporte?.transportador?.nome,
    order.transporte?.logistica?.nome,
    ...(order.transporte?.volumes || []).map(volume => volume.servico),
  ].filter((value): value is string => Boolean(value?.trim()));
}

function classifyShippingMethod(
  order: BlingOrder,
  marketplace: string,
  isFull: boolean
): { method: BlingOrderOperation['shippingMethod']; service?: string } {
  const signals = shippingSignals(order);
  const text = normalizeLabel(signals.join(' '));
  const service = signals[0]?.trim();

  if (isFull || /(^|\W)(full|fulfillment)($|\W)/.test(text)) return { method: 'full', service };
  if (/(^|\W)(flex|mercado envios flex|mercadoflex)($|\W)/.test(text)) return { method: 'flex', service };
  if (/(correios|sedex|\bpac\b|mini envios|impresso normal|carta registrada)/.test(text)) {
    return { method: 'correios', service };
  }
  if (/(mercado envios|mercadoenvios|meli envios|me1|me2)/.test(text)) {
    return { method: 'mercado_envios', service };
  }
  if (normalizeLabel(marketplace).includes('mercado livre')) return { method: 'mercado_envios', service };
  if (signals.length > 0) return { method: 'outro', service };
  return { method: 'nao_identificado' };
}

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
    forceRefresh?: boolean;
  }): Promise<BlingOrder[]> {
    const cacheKey = JSON.stringify({
      dataInicial: params?.dataInicial || '',
      dataFinal: params?.dataFinal || '',
      limite: params?.limite || 100,
      idSituacao: params?.idSituacao || 0,
    });
    const cached = orderListCache.get(cacheKey);
    if (!params?.forceRefresh && cached?.data && cached.expiresAt > Date.now()) return cached.data;
    if (!params?.forceRefresh && cached?.pending) return cached.pending;

    const pending = (async () => {
      const orders: BlingOrder[] = [];
      for (let pagina = 1; pagina <= MAX_ORDER_PAGES; pagina += 1) {
        const page = await this.getOrders({ ...params, pagina });
        orders.push(...page);
        if (page.length < (params?.limite || 100)) break;
      }
      orderListCache.set(cacheKey, { data: orders, expiresAt: Date.now() + ORDER_LIST_CACHE_TTL_MS });
      return orders;
    })();
    orderListCache.set(cacheKey, { pending, expiresAt: Date.now() + ORDER_LIST_CACHE_TTL_MS });
    try {
      return await pending;
    } catch (error) {
      orderListCache.delete(cacheKey);
      throw error;
    }
  }

  private async getWarehouses(): Promise<BlingWarehouse[]> {
    const now = Date.now();
    if (warehouseCache && warehouseCache.expiresAt > now) return warehouseCache.data;

    const result = await this.client.get<BlingWarehousesResponse>('/depositos?limite=100');
    const data = result.data || [];
    warehouseCache = { data, expiresAt: now + OPERATION_CACHE_TTL_MS };
    return data;
  }

  private async getSalesChannels(): Promise<BlingSalesChannel[]> {
    const now = Date.now();
    if (salesChannelsCache && salesChannelsCache.expiresAt > now) return salesChannelsCache.data;

    const result = await this.client.get<BlingSalesChannelsResponse>('/canais-venda?limite=100');
    const data = result.data || [];
    salesChannelsCache = { data, expiresAt: now + OPERATION_CACHE_TTL_MS };
    return data;
  }

  private async getSalesChannel(id: number): Promise<BlingSalesChannel> {
    const now = Date.now();
    const cached = channelCache.get(id);
    if (cached && cached.expiresAt > now) return cached.data;

    const result = await this.client.get<BlingSalesChannelResponse>(`/canais-venda/${id}`);
    channelCache.set(id, { data: result.data, expiresAt: now + OPERATION_CACHE_TTL_MS });
    return result.data;
  }

  async getOrder(id: number): Promise<BlingOrder> {
    const now = Date.now();
    const cached = orderDetailCache.get(id);
    if (cached && cached.expiresAt > now) return cached.data;

    const result = await this.client.get<BlingOrderResponse>(`/pedidos/vendas/${id}`);
    orderDetailCache.set(id, { data: result.data, expiresAt: now + OPERATION_CACHE_TTL_MS });
    return result.data;
  }

  async getOrderDetails(ids: number[]): Promise<BlingOrder[]> {
    const results = await Promise.all(ids.map(async (id) => {
      try {
        return await this.getOrder(id);
      } catch (error) {
        console.warn(`[BlingService] Não foi possível consultar o pedido ${id}:`, error instanceof Error ? error.message : 'unknown');
        return null;
      }
    }));
    return results.filter((order): order is BlingOrder => order !== null);
  }

  async enrichOrdersWithOperation(orders: BlingOrder[]): Promise<BlingOrder[]> {
    const channelIds = [...new Set(
      orders
        .map(order => order.loja?.id)
        .filter((id): id is number => typeof id === 'number' && Number.isInteger(id) && id > 0)
    )];

    const warehouses = await this.getWarehouses().catch((error) => {
      console.warn('[BlingService] Não foi possível listar depósitos:', error instanceof Error ? error.message : 'unknown');
      return [] as BlingWarehouse[];
    });
    const warehousesById = new Map(warehouses.map(warehouse => [warehouse.id, warehouse]));
    const channelsById = new Map<number, BlingSalesChannel>();

    const basicChannels = await this.getSalesChannels().catch((error) => {
      console.warn('[BlingService] Não foi possível listar canais de venda:', error instanceof Error ? error.message : 'unknown');
      return [] as BlingSalesChannel[];
    });
    basicChannels.forEach(channel => channelsById.set(channel.id, channel));

    await Promise.all(channelIds.map(async (channelId) => {
      try {
        channelsById.set(channelId, await this.getSalesChannel(channelId));
      } catch (error) {
        console.warn(`[BlingService] Não foi possível consultar o canal ${channelId}:`, error instanceof Error ? error.message : 'unknown');
      }
    }));

    const inferredMarketplaceByChannel = new Map<number, MarketplaceName>();
    for (const channelId of channelIds) {
      const channel = channelsById.get(channelId);
      const fromChannel = marketplaceFromText(channel?.tipo, channel?.descricao);
      if (fromChannel) inferredMarketplaceByChannel.set(channelId, fromChannel);
    }
    for (const order of orders) {
      const channelId = order.loja?.id;
      const inferred = marketplaceFromOrder(order);
      if (channelId && inferred && (!inferredMarketplaceByChannel.has(channelId) || inferred === 'Amazon')) {
        inferredMarketplaceByChannel.set(channelId, inferred);
      }
    }

    for (const channelId of channelIds.filter(id => !inferredMarketplaceByChannel.has(id))) {
      const sampleOrders = orders.filter(order => order.loja?.id === channelId).slice(0, 3);
      const details = await this.getOrderDetails(sampleOrders.map(order => order.id));
      const inferred = details.map(marketplaceFromOrder).find(Boolean);
      if (inferred) inferredMarketplaceByChannel.set(channelId, inferred);
    }

    // Pedidos antigos ou importados manualmente podem vir sem o ID da loja na
    // listagem. O detalhe ainda traz número externo, logística e observações.
    const ordersWithoutChannel = orders
      .filter(order => !order.loja?.id && !marketplaceFromOrder(order))
      .slice(0, 12);
    const detailedOrdersWithoutChannel = await this.getOrderDetails(ordersWithoutChannel.map(order => order.id));
    const detailMarketplaceByOrder = new Map<number, MarketplaceName>();
    detailedOrdersWithoutChannel.forEach(order => {
      const inferred = marketplaceFromOrder(order);
      if (inferred) detailMarketplaceByOrder.set(order.id, inferred);
    });

    const unresolvedChannels = channelIds.filter(id => !inferredMarketplaceByChannel.has(id));
    const hasAmazonChannel = [...inferredMarketplaceByChannel.values()].includes('Amazon');
    const mercadoLivreCount = [...inferredMarketplaceByChannel.values()].filter(value => value === 'Mercado Livre').length;
    if (!hasAmazonChannel && unresolvedChannels.length === 1 && mercadoLivreCount >= 2) {
      inferredMarketplaceByChannel.set(unresolvedChannels[0], 'Amazon');
    }

    const fullChannelIds = new Set<number>();
    for (const [channelId, channel] of channelsById) {
      const branchSignals = (channel.filiais || []).flatMap(branch => [
        branch.unidadeNegocio,
        branch.deposito?.id ? warehousesById.get(branch.deposito.id)?.descricao : undefined,
      ]);
      if (containsFullSignal(channel.descricao, channel.tipo, ...branchSignals)) {
        fullChannelIds.add(channelId);
      }
    }
    for (const order of orders) {
      if (order.loja?.id && orderFullSignal(order)) fullChannelIds.add(order.loja.id);
    }

    const mercadoLivreChannelIds = channelIds.filter(channelId => {
      const channel = channelsById.get(channelId);
      return marketplaceLabel(
        channel?.tipo,
        channel?.descricao,
        undefined,
        inferredMarketplaceByChannel.get(channelId)
      ) === 'Mercado Livre';
    });
    const identifiedFullChannel = mercadoLivreChannelIds.some(channelId => fullChannelIds.has(channelId));
    if (!identifiedFullChannel && mercadoLivreChannelIds.length >= 2) {
      // Nesta conta, a integração 02-FULL foi criada depois da integração 01-Matriz.
      fullChannelIds.add(Math.max(...mercadoLivreChannelIds));
    }

    return orders.map((order) => {
      const channelId = order.loja?.id;
      const businessUnitId = order.loja?.unidadeNegocio?.id;
      const channel = channelId ? channelsById.get(channelId) : undefined;
      const branch = channel?.filiais?.find(item => item.idUnidadeNegocio === businessUnitId)
        || channel?.filiais?.find(item => item.padrao)
        || channel?.filiais?.[0];
      const warehouseId = branch?.deposito?.id;
      const warehouse = warehouseId ? warehousesById.get(warehouseId) : undefined;
      const inferredMarketplace = channelId
        ? inferredMarketplaceByChannel.get(channelId)
        : detailMarketplaceByOrder.get(order.id);
      const marketplace = marketplaceLabel(
        channel?.tipo,
        channel?.descricao,
        order.numeroLoja,
        inferredMarketplace || marketplaceFromOrder(order)
      );
      const isFull = Boolean(channelId && fullChannelIds.has(channelId))
        || containsFullSignal(channel?.descricao, branch?.unidadeNegocio, warehouse?.descricao)
        || orderFullSignal(order);
      const fulfillment: BlingOrderOperation['fulfillment'] = isFull ? 'full' : 'matriz';
      const shipping = classifyShippingMethod(order, marketplace, isFull);
      const fallbackStoreName = marketplace === 'Amazon'
        ? 'Amazon'
        : marketplace === 'Mercado Livre'
          ? isFull ? 'Mercado Livre - 02 - FULL' : 'Loja Mercado Livre - 01'
          : 'Loja não identificada';
      const storeName = channel?.descricao?.trim() || fallbackStoreName;
      const businessUnitName = branch?.unidadeNegocio?.trim() || (isFull ? 'Filial' : 'Matriz');
      const warehouseName = warehouse?.descricao?.trim()
        || (warehouseId ? `Depósito ${warehouseId}` : isFull ? 'full_Mercado Livre' : 'Geral');

      return {
        ...order,
        operacao: {
          channelId,
          storeName,
          marketplace,
          businessUnitId: businessUnitId || branch?.idUnidadeNegocio,
          businessUnitName,
          warehouseId,
          warehouseName,
          fulfillment,
          shippingMethod: shipping.method,
          shippingService: shipping.service,
        },
      };
    });
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

  async getAllProducts(params?: {
    limite?: number;
    forceRefresh?: boolean;
  }): Promise<BlingProduct[]> {
    if (!params?.forceRefresh && productListCache?.data && productListCache.expiresAt > Date.now()) {
      return productListCache.data;
    }
    if (!params?.forceRefresh && productListCache?.pending) return productListCache.pending;

    const limit = params?.limite || 100;
    const pending = (async () => {
      const products: BlingProduct[] = [];
      for (let pagina = 1; pagina <= MAX_PRODUCT_PAGES; pagina += 1) {
        const page = await this.getProducts({ pagina, limite: limit });
        products.push(...page);
        if (page.length < limit) break;
      }
      productListCache = { data: products, expiresAt: Date.now() + PRODUCT_LIST_CACHE_TTL_MS };
      return products;
    })();
    productListCache = { pending, expiresAt: Date.now() + PRODUCT_LIST_CACHE_TTL_MS };
    try {
      return await pending;
    } catch (error) {
      productListCache = null;
      throw error;
    }
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

  async getDashboardData(forceRefresh = false): Promise<DashboardData> {
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

      const [currentOrderList, previousOrders] = await Promise.all([
        this.getAllOrders({
          dataInicial: formatDate(thirtyDaysAgo),
          dataFinal: formatDate(now),
          limite: 100,
          forceRefresh,
        }),
        this.getAllOrders({
          dataInicial: formatDate(sixtyDaysAgo),
          dataFinal: formatDate(thirtyDaysAgo),
          limite: 100,
          forceRefresh,
        }).catch(() => [] as BlingOrder[]),
      ]);
      const currentOrders = await this.enrichOrdersWithOperation(currentOrderList);

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
          const marketplace = normalizeLabel(order.operacao?.marketplace);
          if (marketplace.includes('mercado livre')) {
            entry.ML += val;
          } else if (marketplace.includes('amazon')) {
            entry.Amazon += val;
          } else {
            entry.Outros += val;
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
          Outros: Math.round(entry.Outros),
          Total: Math.round(entry.ML + entry.Amazon + entry.Outros),
        };
      });

      const marketplaceSummary = currentOrders.reduce((summary, order) => {
        const marketplace = normalizeLabel(order.operacao?.marketplace);
        if (marketplace.includes('mercado livre')) summary.mercadoLivre += 1;
        else if (marketplace.includes('amazon')) summary.amazon += 1;
        else summary.naoIdentificado += 1;
        return summary;
      }, { mercadoLivre: 0, amazon: 0, naoIdentificado: 0 });

      return {
        connected: true,
        metrics,
        salesData,
        recentOrders: currentOrders.slice(0, 5),
        marketplaceSummary,
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
