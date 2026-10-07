export interface ProductAnalysisResponse { suggestedCategory: string; keyFeatures: string[]; estimatedPriceRange: { min: number; max: number }; }
export interface MarketReportResponse { trends: string[]; opportunities: string[]; threats: string[]; }
export interface ListingGenerationResponse { title: string; description: string; keywords: string[]; }
export interface CompleteListingResponse {
  title: string;
  description: string;
  keywords: string[];
  category: string;
  highlights: string[];
  suggestedPrice: {
    min: number;
    recommended: number;
    max: number;
    rationale: string;
  };
  warnings: string[];
}
export interface SalesAnalysisResponse { insights: string[]; recommendations: string[]; }
export interface ChatResponse { reply: string; }
