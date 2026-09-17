import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider } from './AIProvider';
import { ProductAnalysisRequest, ProductAnalysisResponse, MarketReportRequest, MarketReportResponse, ListingGenerationRequest, SalesAnalysisRequest, SalesAnalysisResponse, ChatRequest, ChatResponse } from '../types';
import { AIError } from '../errors/AIError';
import { buildAnalyzeProductPrompt } from '../prompts/analyzeProduct';
import { buildGenerateListingTitlePrompt, buildGenerateListingDescriptionPrompt } from '../prompts/generateListing';
import { buildAnalyzeSalesPrompt } from '../prompts/analyzeSales';
import { buildChatPrompt } from '../prompts/chat';

export class GeminiProvider implements AIProvider {
  private ai: GoogleGenerativeAI;
  private readonly defaultModel = 'gemini-2.5-flash';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new AIError('GEMINI_API_KEY is not defined in environment variables.', 'Gemini');
    }
    this.ai = new GoogleGenerativeAI(apiKey);
  }

  private handleError(error: unknown, operation: string): never {
    console.error(`[GeminiProvider] Error during ${operation}:`, error);
    const err = error instanceof Error ? error : new Error('Erro interno de comunicação com o modelo Gemini');
    const status = typeof (error as { status?: unknown })?.status === 'number'
      ? (error as { status: number }).status
      : 500;
    throw new AIError(err.message, 'Gemini', status);
  }

  async analyzeProductImage(request: ProductAnalysisRequest): Promise<ProductAnalysisResponse> {
    try {
      const model = this.ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const prompt = buildAnalyzeProductPrompt(request);
      const imagePart = { inlineData: { data: request.imageBuffer, mimeType: request.mimeType } };
      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(text) as ProductAnalysisResponse;
    } catch (error) {
      this.handleError(error, 'analyzeProductImage');
    }
  }

  async generateMarketReport(request: MarketReportRequest): Promise<MarketReportResponse> {
    try {
      const model = this.ai.getGenerativeModel({ model: this.defaultModel });
      const prompt = `Você é um analista de e-commerce especialista em marketplaces brasileiros (Mercado Livre e Amazon).

Seu trabalho é analisar os dados de busca reais que eu raspei do Mercado Livre e gerar um relatório de oportunidades de venda.

CATEGORIAS DO VENDEDOR: ${request.category}

DADOS REAIS RASPADOS DO MERCADO LIVRE (preços, títulos, frete, vendedores):
${request.competitorsData}

INSTRUÇÕES:
1. Analise os preços praticados pelos concorrentes em cada categoria.
2. Identifique oportunidades concretas de venda (produtos com alta demanda, pouca concorrência, faixas de preço exploráveis).
3. Identifique ameaças (concorrentes com frete grátis, preços muito baixos, vendedores oficiais dominando).
4. Sugira ações práticas: qual produto vender, a que faixa de preço, e por quê.

FORMATO OBRIGATÓRIO DE RESPOSTA:
Responda EXCLUSIVAMENTE com um objeto JSON válido, sem nenhum texto antes ou depois. Sem markdown. Sem explicações fora do JSON.

O JSON deve ter exatamente esta estrutura:
{
  "trends": ["tendência 1 com detalhes de preço", "tendência 2"],
  "opportunities": ["oportunidade 1 com ação concreta e faixa de preço sugerida", "oportunidade 2"],
  "threats": ["ameaça 1 com dados", "ameaça 2"]
}

Cada array deve ter entre 3 e 6 itens. Cada item deve ser uma frase completa em português com dados concretos (preços, percentuais, nomes de produtos).`;

      const result = await model.generateContent(prompt);
      const rawText = (await result.response).text();
      // Extrai apenas o JSON da resposta, ignorando qualquer texto extra
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('A IA não retornou um JSON válido.');
      }
      return JSON.parse(jsonMatch[0]) as MarketReportResponse;
    } catch (error) {
      this.handleError(error, 'generateMarketReport');
    }
  }

  async generateListingTitle(request: ListingGenerationRequest): Promise<string> {
    try {
      const model = this.ai.getGenerativeModel({ model: this.defaultModel });
      const prompt = buildGenerateListingTitlePrompt(request);
      const result = await model.generateContent(prompt);
      return (await result.response).text().trim();
    } catch (error) {
      this.handleError(error, 'generateListingTitle');
    }
  }

  async generateListingDescription(request: ListingGenerationRequest): Promise<string> {
    try {
      const model = this.ai.getGenerativeModel({ model: this.defaultModel });
      const prompt = buildGenerateListingDescriptionPrompt(request);
      const result = await model.generateContent(prompt);
      return (await result.response).text().trim();
    } catch (error) {
      this.handleError(error, 'generateListingDescription');
    }
  }

  async analyzeSalesMetrics(request: SalesAnalysisRequest): Promise<SalesAnalysisResponse> {
    try {
      const model = this.ai.getGenerativeModel({ model: this.defaultModel });
      const prompt = buildAnalyzeSalesPrompt(request);
      const result = await model.generateContent(prompt);
      const text = (await result.response).text().replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(text) as SalesAnalysisResponse;
    } catch (error) {
      this.handleError(error, 'analyzeSalesMetrics');
    }
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const model = this.ai.getGenerativeModel({ model: this.defaultModel });
      const prompt = buildChatPrompt(request);
      const result = await model.generateContent(prompt);
      return { reply: (await result.response).text().trim() };
    } catch (error) {
      this.handleError(error, 'chat');
    }
  }
}
