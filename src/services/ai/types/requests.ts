export interface ProductAnalysisRequest { imageBuffer: string; mimeType: string; }
export interface MarketReportRequest { category: string; competitorsData: string; }
export interface ListingGenerationRequest { productName: string; features: string[]; }
export interface SalesAnalysisRequest { salesData: string; period: string; }
export interface ChatRequest { message: string; context?: string; }