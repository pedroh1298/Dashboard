import { ChatRequest } from '../types';

export function buildChatPrompt(request: ChatRequest): string {
  const contextBlock = request.context ? `Contexto atual: ${request.context}\n\n` : '';
  return `Você é um assistente de IA especialista em marketplaces (Mercado Livre e Amazon). ${contextBlock}Pergunta do usuário: ${request.message}`;
}