import { ProductAnalysisRequest } from '../types';

export function buildAnalyzeProductPrompt(request: ProductAnalysisRequest): string {
  return `Você é um especialista em e-commerce. Analise esta imagem de produto e retorne um JSON com a categoria sugerida, características principais e faixa de preço estimada. Não inclua markdown, apenas o JSON bruto.`;
}