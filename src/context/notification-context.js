import { createContext } from "react";

const EMPTY_CONTEXT = Object.freeze({
    error: null,
    hasMoreNotifications: false,
    loadOlder: async () => false,
    loading: false,
    loadingOlderNotifications: false,
    markAllRead: async () => {},
    notifications: [],
    retryNotifications: () => {},
    setRead: async () => {},
    unreadCount: 0
});

export const NotificationContext = createContext(EMPTY_CONTEXT);
