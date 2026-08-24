import { AIProvider } from './providers/AIProvider';
import { GeminiProvider } from './providers/GeminiProvider';
import { AIError } from './errors/AIError';

export class AIService {
  private static instance: AIProvider;

  public static getProvider(): AIProvider {
    if (!this.instance) {
      const providerType = process.env.ACTIVE_AI_PROVIDER || 'gemini';
      switch (providerType.toLowerCase()) {
        case 'gemini':
          this.instance = new GeminiProvider();
          break;
        default:
          console.warn(`Provider ${providerType} not found, falling back to Gemini`);
          this.instance = new GeminiProvider();
      }
    }
    return this.instance;
  }
}

export * from './types';
export { AIError };