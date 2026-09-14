import { NextResponse } from 'next/server';
import { BlingTokenManager } from '@/services/bling/tokenManager';

export async function GET() {
  const connected = BlingTokenManager.isConnected();
  const tokens = BlingTokenManager.getStoredTokens();

  return NextResponse.json({
    connected,
    expiresAt: tokens?.expires_at || null,
    scope: tokens?.scope || null,
  });
}

export async function DELETE() {
  BlingTokenManager.clearTokens();
  return NextResponse.json({ success: true, message: 'Bling desconectado com sucesso.' });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (body.code) {
      let code = String(body.code).trim();
      // Se o usuário colou a URL inteira retornada pelo Bling
      if (code.includes('code=')) {
        const match = code.match(/[?&]code=([^&#]+)/);
        if (match && match[1]) {
          code = decodeURIComponent(match[1]);
        }
      }
      
      const tokens = await BlingTokenManager.exchangeCodeForTokens(code);
      return NextResponse.json({ success: true, tokens });
    }

    if (body.access_token) {
      const saved = BlingTokenManager.saveTokens({
        access_token: body.access_token.trim(),
        refresh_token: (body.refresh_token || '').trim(),
        expires_in: body.expires_in || 21600,
        token_type: body.token_type || 'Bearer',
        scope: body.scope || 'all',
      });
      return NextResponse.json({ success: true, tokens: saved });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Parâmetros inválidos. Forneça o código de autorização (code) ou o access_token.' 
    }, { status: 400 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[API Bling Status POST] Erro:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
