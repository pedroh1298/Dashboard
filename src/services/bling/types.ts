export interface BlingTokenData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
  expires_at: number; // Timestamp em milissegundos
}

export interface BlingIntegrationRecord extends BlingTokenData {
  ownerId: string;
  connected_at: number;
  updated_at: number;
  status: 'active' | 'disconnected' | 'expired';
}

export interface BlingOrderContact {
  id?: number;
  nome?: string;
  tipoPessoa?: string;
  numeroDocumento?: string;
}

export interface BlingOrderSituation {
  id: number;
  valor?: string;
}

export interface BlingOrderItem {
  id?: number;
  codigo?: string;
  descricao?: string;
  quantidade?: number;
  valor?: number;
}

export interface BlingOrder {
  id: number;
  numero: number;
  numeroLoja?: string;
  data: string; // YYYY-MM-DD
  dataSaida?: string;
  dataPrevista?: string;
  total: number;
  contato?: BlingOrderContact;
  situacao?: BlingOrderSituation;
  loja?: {
    id?: number;
    unidadeNegocio?: {
      id?: number;
    };
  };
  itens?: BlingOrderItem[];
  operacao?: BlingOrderOperation;
}

export type BlingFulfillmentType = 'full' | 'matriz' | 'nao_identificado';

export interface BlingOrderOperation {
  channelId?: number;
  storeName: string;
  marketplace: string;
  businessUnitId?: number;
  businessUnitName: string;
  warehouseId?: number;
  warehouseName: string;
  fulfillment: BlingFulfillmentType;
}

export interface BlingSalesChannelBranch {
  cnpj?: string;
  idUnidadeNegocio?: number;
  unidadeNegocio?: string;
  deposito?: {
    id?: number;
  };
  padrao?: boolean;
}

export interface BlingSalesChannel {
  id: number;
  descricao?: string;
  tipo?: string;
  situacao?: number;
  filiais?: BlingSalesChannelBranch[];
}

export interface BlingSalesChannelResponse {
  data: BlingSalesChannel;
}

export interface BlingSalesChannelsResponse {
  data: BlingSalesChannel[];
}

export interface BlingWarehouse {
  id: number;
  descricao?: string;
  situacao?: number;
  padrao?: boolean;
  desconsiderarSaldo?: boolean;
}

export interface BlingWarehousesResponse {
  data: BlingWarehouse[];
}

export interface BlingOrdersResponse {
  data: BlingOrder[];
}

export interface BlingOrderResponse {
  data: BlingOrder;
}

export interface BlingProduct {
  id: number;
  nome: string;
  codigo: string;
  preco: number;
  tipo?: string;
  situacao?: string;
  formato?: string;
  estoque?: {
    saldoFisicoTotal?: number;
    saldoVirtualTotal?: number;
  };
}

export interface BlingProductsResponse {
  data: BlingProduct[];
}

export interface DashboardSalesPoint {
  name: string;
  ML: number;
  Amazon: number;
  Outros?: number;
  Total?: number;
}

export interface DashboardMetrics {
  faturamento: number;
  lucro: number;
  pedidos: number;
  ticketMedio: number;
  faturamentoTrend: number;
  lucroTrend: number;
  pedidosTrend: number;
  ticketTrend: number;
}

export interface DashboardData {
  connected: boolean;
  metrics: DashboardMetrics;
  salesData: DashboardSalesPoint[];
  recentOrders?: BlingOrder[];
  message?: string;
}
