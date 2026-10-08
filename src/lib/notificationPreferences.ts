export type NotificationCategory = 'orders' | 'deliveries' | 'stock' | 'integration';

export interface NotificationPreferences {
  orders: boolean;
  deliveries: boolean;
  stock: boolean;
  integration: boolean;
}

export const NOTIFICATION_PREFERENCES_KEY = 'dashboard_notification_preferences';
export const NOTIFICATION_PREFERENCES_EVENT = 'notification-preferences-changed';

export const defaultNotificationPreferences: NotificationPreferences = {
  orders: true,
  deliveries: true,
  stock: true,
  integration: true,
};

export function loadNotificationPreferences(): NotificationPreferences {
  if (typeof window === 'undefined') return defaultNotificationPreferences;

  try {
    const saved = JSON.parse(window.localStorage.getItem(NOTIFICATION_PREFERENCES_KEY) || '{}');
    return {
      orders: saved.orders !== false,
      deliveries: saved.deliveries !== false,
      stock: saved.stock !== false,
      integration: saved.integration !== false,
    };
  } catch {
    return defaultNotificationPreferences;
  }
}

export function saveNotificationPreferences(preferences: NotificationPreferences) {
  window.localStorage.setItem(NOTIFICATION_PREFERENCES_KEY, JSON.stringify(preferences));
  window.dispatchEvent(new CustomEvent(NOTIFICATION_PREFERENCES_EVENT));
}
