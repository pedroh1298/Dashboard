"use client";

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Bell, Box, Check, Clock3, RefreshCw, ShoppingCart, X } from 'lucide-react';
import {
  loadNotificationPreferences,
  NOTIFICATION_PREFERENCES_EVENT,
  type NotificationCategory,
  type NotificationPreferences,
} from '@/lib/notificationPreferences';

interface DashboardNotification {
  id: string;
  category: NotificationCategory;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  href: string;
  count: number;
}

const LAST_READ_KEY = 'dashboard_notifications_last_read';
const CACHE_KEY = 'dashboard_notifications_cache';
const CACHE_TTL_MS = 2 * 60 * 1000;

const categoryIcons = {
  orders: ShoppingCart,
  deliveries: Clock3,
  stock: Box,
  integration: AlertCircle,
};

function signature(items: DashboardNotification[]): string {
  return items.map(item => item.id).sort().join('|');
}

export default function NotificationsButton() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(loadNotificationPreferences);
  const [lastRead, setLastRead] = useState('');

  const loadNotifications = useCallback(async (force = false) => {
    setLoading(true);
    setError('');
    try {
      if (!force) {
        const cached = JSON.parse(window.sessionStorage.getItem(CACHE_KEY) || 'null');
        if (cached?.savedAt > Date.now() - CACHE_TTL_MS && Array.isArray(cached.notifications)) {
          setNotifications(cached.notifications);
          return;
        }
      }

      const response = await fetch('/api/notifications', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Falha ao carregar notificações.');
      const next = Array.isArray(data.notifications) ? data.notifications : [];
      setNotifications(next);
      window.sessionStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), notifications: next }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Falha ao carregar notificações.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLastRead(window.localStorage.getItem(LAST_READ_KEY) || '');
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    const updatePreferences = () => setPreferences(loadNotificationPreferences());
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener(NOTIFICATION_PREFERENCES_EVENT, updatePreferences);
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener(NOTIFICATION_PREFERENCES_EVENT, updatePreferences);
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  const visible = useMemo(
    () => notifications.filter(notification => preferences[notification.category]),
    [notifications, preferences]
  );
  const currentSignature = signature(visible);
  const unread = visible.length > 0 && currentSignature !== lastRead ? visible.length : 0;

  const toggleOpen = () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) {
      window.localStorage.setItem(LAST_READ_KEY, currentSignature);
      setLastRead(currentSignature);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        className="icon-button relative"
        aria-label={unread > 0 ? `${unread} notificações novas` : 'Notificações'}
        aria-expanded={open}
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c85c4a] px-1 text-[9px] font-bold leading-none text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <section className="fixed inset-x-3 top-16 z-50 overflow-hidden rounded-[6px] border border-[#303630] bg-[#171b18] shadow-[0_18px_60px_rgba(0,0,0,0.45)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-11 sm:w-[390px]">
          <div className="flex items-center justify-between border-b border-[#303630] px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-[#f2f4f0]">Notificações</h2>
              <p className="mt-0.5 text-[11px] text-[#a1a8a0]">Pedidos, prazos e estoque do Bling</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => loadNotifications(true)}
                disabled={loading}
                className="icon-button"
                title="Atualizar notificações"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button type="button" onClick={() => setOpen(false)} className="icon-button" title="Fechar">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-[min(430px,70vh)] overflow-y-auto">
            {loading && visible.length === 0 ? (
              <div className="flex items-center justify-center gap-2 px-5 py-10 text-sm text-[#a1a8a0]">
                <RefreshCw className="h-4 w-4 animate-spin" /> Atualizando alertas...
              </div>
            ) : error ? (
              <div className="px-5 py-8 text-center">
                <AlertCircle className="mx-auto mb-2 h-5 w-5 text-[#e68c7e]" />
                <p className="text-sm text-[#d9ddd8]">{error}</p>
              </div>
            ) : visible.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Check className="mx-auto mb-2 h-5 w-5 text-[#66b89d]" />
                <p className="text-sm font-medium text-[#f2f4f0]">Tudo em dia</p>
                <p className="mt-1 text-xs text-[#a1a8a0]">Nenhum alerta ativo neste momento.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#303630]">
                {visible.map((notification) => {
                  const Icon = categoryIcons[notification.category];
                  const color = notification.severity === 'critical'
                    ? 'text-[#e68c7e] bg-[#38211f]'
                    : notification.severity === 'warning'
                      ? 'text-[#dca45e] bg-[#3a2c19]'
                      : 'text-[#77afc2] bg-[#1b3038]';
                  return (
                    <Link
                      key={notification.id}
                      href={notification.href}
                      onClick={() => setOpen(false)}
                      className="flex gap-3 px-4 py-3.5 hover:bg-[#20251f]"
                    >
                      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] ${color}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-[#f2f4f0]">{notification.title}</span>
                        <span className="mt-1 block text-xs leading-5 text-[#a1a8a0]">{notification.message}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-[#303630] px-4 py-2.5 text-right">
            <Link href="/configuracoes" onClick={() => setOpen(false)} className="text-xs font-medium text-[#66b89d] hover:text-[#8bcbb6]">
              Configurar alertas
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
