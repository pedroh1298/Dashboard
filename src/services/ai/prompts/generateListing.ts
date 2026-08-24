import { ListingGenerationRequest } from '../types';

export function buildGenerateListingTitlePrompt(request: ListingGenerationRequest): string {
  return `Crie um título otimizado para SEO para o marketplace (máx 60 caracteres) para o produto: ${request.productName}. Características: ${request.features.join(', ')}.`;
}

export function buildGenerateListingDescriptionPrompt(request: ListingGenerationRequest): string {
  return `Crie uma descrição de vendas persuasiva para o produto: ${request.productName}, destacando os benefícios das seguintes características: ${request.features.join(', ')}.`;
}