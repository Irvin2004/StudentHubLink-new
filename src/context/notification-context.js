import { createContext } from "react";

const EMPTY_CONTEXT = Object.freeze({
    error: null,
    loading: false,
    markAllRead: async () => {},
    notifications: [],
    setRead: async () => {},
    unreadCount: 0
});

export const NotificationContext = createContext(EMPTY_CONTEXT);
