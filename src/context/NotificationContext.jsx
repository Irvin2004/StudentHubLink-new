import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { NotificationContext } from "./notification-context.js";
import { useAuth } from "../hooks/useAuth.js";
import { useToast } from "../hooks/useToast.js";
import { useSettings } from "../hooks/useSettings.js";
import {
    listenToNotifications,
    markAllNotificationsRead,
    markNotification
} from "../services/notification-service.js";

const EMPTY_NOTIFICATIONS = Object.freeze([]);

export function NotificationProvider({ children }) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const { settings } = useSettings();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(Boolean(user?.uid));
    const [error, setError] = useState(null);
    const initializedRef = useRef(false);
    const knownIdsRef = useRef(new Set());
    const userId = user?.uid;

    useEffect(() => {
        if (!userId) {
            return undefined;
        }
        initializedRef.current = false;
        knownIdsRef.current = new Set();
        return listenToNotifications(
            userId,
            (next) => {
                if (initializedRef.current) {
                    const incoming = next.find(
                        (item) =>
                            !item.read && !knownIdsRef.current.has(item.id)
                    );
                    if (incoming && settings.notifications.enabled) {
                        showToast({
                            title: incoming.title,
                            message: incoming.message,
                            type: incoming.type.includes("mention")
                                ? "info"
                                : "success"
                        });
                    }
                }
                knownIdsRef.current = new Set(next.map((item) => item.id));
                initializedRef.current = true;
                setNotifications(next);
                setLoading(false);
            },
            (nextError) => {
                setError(nextError);
                setLoading(false);
            }
        );
    }, [settings.notifications.enabled, showToast, userId]);

    const setRead = useCallback(
        (id, read) => markNotification(userId, id, read),
        [userId]
    );
    const markAllRead = useCallback(
        () => markAllNotificationsRead(userId),
        [userId]
    );
    const visibleNotifications = userId ? notifications : EMPTY_NOTIFICATIONS;
    const unreadCount = visibleNotifications.reduce(
        (count, item) => count + (item.read ? 0 : 1),
        0
    );
    const value = useMemo(
        () => ({
            error,
            loading: userId ? loading : false,
            markAllRead,
            notifications: visibleNotifications,
            setRead,
            unreadCount
        }),
        [
            error,
            loading,
            markAllRead,
            setRead,
            unreadCount,
            userId,
            visibleNotifications
        ]
    );

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}
