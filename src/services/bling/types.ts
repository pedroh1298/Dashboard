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
  total: number;
  contato?: BlingOrderContact;
  situacao?: BlingOrderSituation;
  loja?: {
    id?: number;
  };
  itens?: BlingOrderItem[];
}

export interface BlingOrdersResponse {
  data: BlingOrder[];
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
