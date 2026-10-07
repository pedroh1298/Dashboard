import { CompleteListingRequest, ListingGenerationRequest } from '../types';

export function buildGenerateListingTitlePrompt(request: ListingGenerationRequest): string {
  return `Crie um título otimizado para SEO para o marketplace (máx 60 caracteres) para o produto: ${request.productName}. Características: ${request.features.join(', ')}.`;
}

export function buildGenerateListingDescriptionPrompt(request: ListingGenerationRequest): string {
  return `Crie uma descrição de vendas persuasiva para o produto: ${request.productName}, destacando os benefícios das seguintes características: ${request.features.join(', ')}.`;
}

const marketplaceNames = {
  mercado_livre: 'Mercado Livre',
  amazon: 'Amazon',
  ambos: 'Mercado Livre e Amazon',
};

const toneNames = {
  direto: 'direto, claro e objetivo',
  premium: 'premium, elegante e confiável',
  tecnico: 'técnico, preciso e informativo',
};

export function buildCompleteListingPrompt(request: CompleteListingRequest): string {
  const referencePrice = request.referencePrice
    ? `R$ ${request.referencePrice.toFixed(2).replace('.', ',')}`
    : 'não informado';

  return `Você é um especialista brasileiro em cadastro e otimização de anúncios para marketplaces.

Analise a imagem, quando fornecida, e os dados abaixo. Crie um anúncio comercial preciso, sem inventar marca, modelo, material, medidas, certificações, garantia ou acessórios que não estejam visíveis ou informados.

DADOS DO PRODUTO
- Nome informado: ${request.productName || 'identifique pela imagem'}
- Características informadas: ${request.features.length ? request.features.join('; ') : 'nenhuma'}
- Categoria informada: ${request.category || 'não informada'}
- Público: ${request.audience || 'geral'}
- Condição: ${request.condition === 'novo' ? 'novo' : 'usado'}
- Marketplace: ${marketplaceNames[request.marketplace]}
- Tom: ${toneNames[request.tone]}
- Preço de referência: ${referencePrice}

REGRAS
1. Escreva em português do Brasil.
2. O título deve ter no máximo 60 caracteres, sem emojis, caixa alta excessiva ou palavras promocionais vagas.
3. A descrição deve ser escaneável, com uma abertura curta, benefícios reais, lista de características e fechamento objetivo.
4. Não inclua telefone, links, dados de contato, promessas absolutas, frete grátis ou informações não confirmadas.
5. Gere de 5 a 10 palavras-chave sem repetição e de 3 a 6 destaques curtos.
6. O preço sugerido deve ser apenas uma estimativa coerente. Se os dados forem insuficientes, use valores conservadores e explique a limitação.
7. Em warnings, liste somente informações importantes que o vendedor deve confirmar antes de publicar. Se não houver, retorne uma lista vazia.

Retorne EXCLUSIVAMENTE JSON válido com esta estrutura:
{
  "title": "string",
  "description": "string",
  "keywords": ["string"],
  "category": "string",
  "highlights": ["string"],
  "suggestedPrice": {
    "min": 0,
    "recommended": 0,
    "max": 0,
    "rationale": "string"
  },
  "warnings": ["string"]
}`;
}
