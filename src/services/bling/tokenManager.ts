import fs from 'fs';
import path from 'path';
import { BlingTokenData } from './types';

const TOKEN_FILE_DIR = path.join(process.cwd(), '.data');
const TOKEN_FILE_PATH = path.join(TOKEN_FILE_DIR, 'bling_tokens.json');

export class BlingTokenManager {
  private static inMemoryTokens: BlingTokenData | null = null;

  private static getClientId(): string {
    const id = process.env.BLING_CLIENT_ID;
    if (!id) throw new Error('BLING_CLIENT_ID não está configurado nas variáveis de ambiente.');
    return id.trim();
  }

  private static getClientSecret(): string {
    const secret = process.env.BLING_CLIENT_SECRET;
    if (!secret) throw new Error('BLING_CLIENT_SECRET não está configurado nas variáveis de ambiente.');
    return secret.trim();
  }

  public static getRedirectUri(): string {
    return (process.env.BLING_REDIRECT_URI || 'https://api.dmaisfashion.com.br/bling/callback').trim();
  }

  /**
   * Gera o cabeçalho Authorization Basic com ClientId:ClientSecret codificados em Base64
   */
  private static getBasicAuthHeader(): string {
    const credentials = `${this.getClientId()}:${this.getClientSecret()}`;
    return `Basic ${Buffer.from(credentials).toString('base64')}`;
  }

  /**
   * Gera a URL para onde o usuário deve ser redirecionado para autorizar o app no Bling
   */
  public static getAuthorizationUrl(state: string = 'bling_oauth'): string {
    const clientId = this.getClientId();
    // A URL oficial do Bling v3 para autorização OAuth
    return `https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${clientId}&state=${encodeURIComponent(state)}`;
  }

  /**
   * Carrega os tokens salvos em disco ou memória
   */
  public static getStoredTokens(): BlingTokenData | null {
    if (this.inMemoryTokens) {
      return this.inMemoryTokens;
    }

    try {
      if (fs.existsSync(TOKEN_FILE_PATH)) {
        const fileContent = fs.readFileSync(TOKEN_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(fileContent) as BlingTokenData;
        this.inMemoryTokens = parsed;
        return parsed;
      }
    } catch (error) {
      console.warn('[BlingTokenManager] Erro ao ler tokens do arquivo:', error);
    }

    return null;
  }

  /**
   * Salva os tokens em disco e memória
   */
  public static saveTokens(tokenData: Omit<BlingTokenData, 'expires_at'> & { expires_at?: number }): BlingTokenData {
    const expiresAt = tokenData.expires_at || (Date.now() + (tokenData.expires_in * 1000));
    const fullData: BlingTokenData = {
      ...tokenData,
      expires_at: expiresAt
    };

    this.inMemoryTokens = fullData;

    try {
      if (!fs.existsSync(TOKEN_FILE_DIR)) {
        fs.mkdirSync(TOKEN_FILE_DIR, { recursive: true });
      }
      fs.writeFileSync(TOKEN_FILE_PATH, JSON.stringify(fullData, null, 2), 'utf-8');
    } catch (error) {
      console.warn('[BlingTokenManager] Erro ao salvar tokens no disco (persistindo em memória):', error);
    }

    return fullData;
  }

  /**
   * Troca o Authorization Code obtido no callback pelos Access e Refresh Tokens
   */
  public static async exchangeCodeForTokens(code: string): Promise<BlingTokenData> {
    const basicAuth = this.getBasicAuthHeader();
    
    const bodyParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code.trim(),
    });

    const response = await fetch('https://api.bling.com.br/Api/v3/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': basicAuth,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': '1.0',
        'enable-jwt': '1',
      },
      body: bodyParams.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[BlingTokenManager] Falha ao trocar code por token:', response.status, errorText);
      throw new Error(`Falha na autorização com o Bling: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return this.saveTokens(data);
  }

  /**
   * Renova o Access Token usando o Refresh Token
   */
  public static async refreshAccessToken(): Promise<BlingTokenData> {
    const currentTokens = this.getStoredTokens();
    if (!currentTokens?.refresh_token) {
      throw new Error('Nenhum refresh_token disponível para renovar o acesso ao Bling.');
    }

    const basicAuth = this.getBasicAuthHeader();
    const bodyParams = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: currentTokens.refresh_token,
    });

    const response = await fetch('https://api.bling.com.br/Api/v3/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': basicAuth,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': '1.0',
        'enable-jwt': '1',
      },
      body: bodyParams.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[BlingTokenManager] Falha ao renovar token:', response.status, errorText);
      throw new Error(`Falha ao renovar credencial do Bling: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return this.saveTokens(data);
  }

  /**
   * Retorna um Access Token válido. Se estiver próximo da expiração (< 5 min), renova automaticamente.
   */
  public static async getValidAccessToken(): Promise<string> {
    let tokens = this.getStoredTokens();
    if (!tokens) {
      throw new Error('Bling não autenticado. Realize a autorização para continuar.');
    }

    // Se faltam menos de 5 minutos (300.000 ms) para expirar, renova automaticamente
    const bufferTime = 5 * 60 * 1000;
    if (Date.now() >= (tokens.expires_at - bufferTime)) {
      console.log('[BlingTokenManager] Token próximo da expiração ou expirado. Renovando...');
      tokens = await this.refreshAccessToken();
    }

    return tokens.access_token;
  }

  /**
   * Verifica se existem tokens válidos configurados
   */
  public static isConnected(): boolean {
    const tokens = this.getStoredTokens();
    return !!(tokens && tokens.access_token);
  }

  /**
   * Remove os tokens (desconectar)
   */
  public static clearTokens(): void {
    this.inMemoryTokens = null;
    try {
      if (fs.existsSync(TOKEN_FILE_PATH)) {
        fs.unlinkSync(TOKEN_FILE_PATH);
      }
    } catch (error) {
      console.warn('[BlingTokenManager] Erro ao deletar arquivo de token:', error);
    }
  }
}
