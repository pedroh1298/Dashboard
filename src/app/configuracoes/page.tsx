"use client";

import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  BellRing,
  CheckCircle2,
  ExternalLink,
  Link2,
  LogOut,
  Power,
  RefreshCw,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import NotificationsButton from '@/components/NotificationsButton';
import {
  defaultNotificationPreferences,
  loadNotificationPreferences,
  saveNotificationPreferences,
  type NotificationPreferences,
} from '@/lib/notificationPreferences';

interface BlingStatus {
  connected: boolean;
  status: 'active' | 'expired' | 'disconnected';
  expiresAt: string | null;
  credentialsConfigured: boolean;
  redirectUri: string;
  probe?: { ok: boolean; resource: string; error?: string };
}

const preferenceRows: Array<{ key: keyof NotificationPreferences; title: string; description: string }> = [
  { key: 'orders', title: 'Pedidos em aberto', description: 'Avise quando houver pedidos aguardando processamento.' },
  { key: 'deliveries', title: 'Prazos de entrega', description: 'Destaque entregas previstas para hoje ou atrasadas.' },
  { key: 'stock', title: 'Estoque', description: 'Mostre produtos sem saldo ou com até cinco unidades.' },
  { key: 'integration', title: 'Integração', description: 'Avise quando a conexão com o Bling precisar de atenção.' },
];

export default function SettingsPage() {
  const [status, setStatus] = useState<BlingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultNotificationPreferences);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/bling/status', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível consultar a integração.');
      setStatus(data);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Falha ao carregar configurações.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPreferences(loadNotificationPreferences());
    loadStatus();
  }, [loadStatus]);

  const togglePreference = (key: keyof NotificationPreferences) => {
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    saveNotificationPreferences(next);
    setMessage({ type: 'success', text: 'Preferências de notificação salvas.' });
  };

  const disconnect = async () => {
    if (!window.confirm('Deseja desconectar o Bling deste painel?')) return;
    setActionLoading(true);
    try {
      const response = await fetch('/api/bling/status', { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Falha ao desconectar o Bling.');
      window.sessionStorage.removeItem('dashboard_notifications_cache');
      setMessage({ type: 'success', text: 'Bling desconectado com sucesso.' });
      await loadStatus();
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Falha ao desconectar o Bling.' });
    } finally {
      setActionLoading(false);
    }
  };

  const healthy = Boolean(status?.connected && status.probe?.ok);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <header className="app-topbar">
          <div className="flex items-center gap-3">
            <Settings className="h-[18px] w-[18px] text-[#66b89d]" />
            <h1 className="text-sm font-semibold">Configurações</h1>
          </div>
          <div className="flex items-center gap-4">
            <NotificationsButton />
            <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-[#26322c] text-[11px] font-semibold text-white">AD</div>
          </div>
        </header>

        <div className="app-content space-y-8">
          <div>
            <p className="page-kicker mb-3">Administração</p>
            <h2 className="page-title">Configurações do painel</h2>
            <p className="page-description mt-2">Gerencie a conexão com o Bling, os alertas operacionais e sua sessão.</p>
          </div>

          {message && (
            <div className={`flex items-start gap-3 rounded-[6px] border px-4 py-3 text-sm ${message.type === 'success' ? 'border-[#376b5a] bg-[#19372e] text-[#8bcbb6]' : 'border-[#673a33] bg-[#38211f] text-[#e8a095]'}`}>
              {message.type === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
              <span className="flex-1">{message.text}</span>
              <button type="button" onClick={() => setMessage(null)} className="text-xs font-semibold">Fechar</button>
            </div>
          )}

          <section className="overflow-hidden rounded-[6px] border border-[#303630] bg-[#171b18]">
            <div className="flex flex-col gap-4 border-b border-[#303630] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] bg-[#1d382f] text-[#66b89d]"><Link2 className="h-[18px] w-[18px]" /></span>
                <div>
                  <h3 className="text-base font-semibold">Integração com o Bling</h3>
                  <p className="mt-1 text-xs text-[#a1a8a0]">Pedidos, produtos, estoque e canais de venda.</p>
                </div>
              </div>
              <div className={`inline-flex w-fit items-center gap-2 rounded-[5px] border px-3 py-1.5 text-xs font-semibold ${healthy ? 'border-[#376b5a] bg-[#19372e] text-[#8bcbb6]' : 'border-[#66502a] bg-[#3a2c19] text-[#e2b474]'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${healthy ? 'bg-[#66b89d]' : 'bg-[#dca45e]'}`} />
                {loading ? 'Verificando' : healthy ? 'Conectado e respondendo' : status?.connected ? 'Conexão requer atenção' : 'Desconectado'}
              </div>
            </div>

            <div className="grid gap-px bg-[#303630] md:grid-cols-3">
              <div className="bg-[#171b18] px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#737d75]">Credenciais</p>
                <p className="mt-2 text-sm font-medium">{status?.credentialsConfigured ? 'Configuradas no servidor' : 'Configuração incompleta'}</p>
              </div>
              <div className="bg-[#171b18] px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#737d75]">Consulta da API</p>
                <p className="mt-2 text-sm font-medium">{status?.probe?.ok ? 'Produtos acessíveis' : status?.probe?.error || 'Aguardando conexão'}</p>
              </div>
              <div className="bg-[#171b18] px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#737d75]">Token</p>
                <p className="mt-2 text-sm font-medium">{status?.expiresAt ? `Renovação automática ativa` : 'Nenhum token ativo'}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 px-5 py-4">
              <button type="button" onClick={loadStatus} disabled={loading || actionLoading} className="button-secondary px-4 text-xs disabled:opacity-50">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Testar conexão
              </button>
              <a href="/api/bling/authorize" className="button-primary px-4 text-xs">
                <ExternalLink className="h-4 w-4" /> {status?.connected ? 'Autorizar novamente' : 'Conectar Bling'}
              </a>
              {status?.connected && (
                <button type="button" onClick={disconnect} disabled={actionLoading} className="button-secondary px-4 text-xs text-[#e68c7e] disabled:opacity-50">
                  <Power className="h-4 w-4" /> Desconectar
                </button>
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-[6px] border border-[#303630] bg-[#171b18]">
            <div className="flex items-start gap-3 border-b border-[#303630] px-5 py-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] bg-[#1b3038] text-[#77afc2]"><BellRing className="h-[18px] w-[18px]" /></span>
              <div>
                <h3 className="text-base font-semibold">Notificações operacionais</h3>
                <p className="mt-1 text-xs text-[#a1a8a0]">Escolha quais avisos aparecem no sino do painel.</p>
              </div>
            </div>
            <div className="divide-y divide-[#303630]">
              {preferenceRows.map(row => (
                <div key={row.key} className="flex items-center justify-between gap-5 px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#f2f4f0]">{row.title}</p>
                    <p className="mt-1 text-xs leading-5 text-[#a1a8a0]">{row.description}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={preferences[row.key]}
                    onClick={() => togglePreference(row.key)}
                    className={`relative h-6 w-11 shrink-0 rounded-full border ${preferences[row.key] ? 'border-[#4a9b80] bg-[#3c8f75]' : 'border-[#465047] bg-[#252b26]'}`}
                    aria-label={`${preferences[row.key] ? 'Desativar' : 'Ativar'} ${row.title}`}
                  >
                    <span className={`absolute top-[3px] h-4 w-4 rounded-full bg-white transition-transform ${preferences[row.key] ? 'translate-x-[21px]' : 'translate-x-[3px]'}`} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-[6px] border border-[#303630] bg-[#171b18]">
            <div className="flex items-start gap-3 border-b border-[#303630] px-5 py-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] bg-[#20251f] text-[#aeb6af]"><ShieldCheck className="h-[18px] w-[18px]" /></span>
              <div>
                <h3 className="text-base font-semibold">Conta e segurança</h3>
                <p className="mt-1 text-xs text-[#a1a8a0]">Sessão administrativa protegida por cookie seguro.</p>
              </div>
            </div>
            <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Administrador</p>
                <p className="mt-1 text-xs text-[#a1a8a0]">Usuário ADMIN • sessão válida por até 8 horas</p>
              </div>
              <form action="/api/auth/logout" method="post">
                <button type="submit" className="button-secondary px-4 text-xs">
                  <LogOut className="h-4 w-4" /> Encerrar sessão
                </button>
              </form>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
