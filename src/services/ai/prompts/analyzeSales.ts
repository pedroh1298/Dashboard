import { SalesAnalysisRequest } from '../types';

export function buildAnalyzeSalesPrompt(request: SalesAnalysisRequest): string {
  return `Analise os seguintes dados de vendas do período ${request.period} e forneça insights e recomendações de negócio. Responda em JSON. Dados: ${request.salesData}`;
}