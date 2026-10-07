export interface ProductAnalysisRequest { imageBuffer: string; mimeType: string; }
export interface MarketReportRequest { category: string; competitorsData: string; }
export interface ListingGenerationRequest { productName: string; features: string[]; }
export type ListingMarketplace = 'mercado_livre' | 'amazon' | 'ambos';
export type ListingTone = 'direto' | 'premium' | 'tecnico';
export type ProductCondition = 'novo' | 'usado';

export interface CompleteListingRequest {
  productName?: string;
  features: string[];
  marketplace: ListingMarketplace;
  tone: ListingTone;
  condition: ProductCondition;
  category?: string;
  audience?: string;
  referencePrice?: number;
  imageBuffer?: string;
  mimeType?: string;
}
export interface SalesAnalysisRequest { salesData: string; period: string; }
export interface ChatRequest { message: string; context?: string; }
