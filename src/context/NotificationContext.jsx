import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { NotificationContext } from "./notification-context.js";
import { useAuth } from "../hooks/useAuth.js";
import { useToast } from "../hooks/useToast.js";
import { useSettings } from "../hooks/useSettings.js";
import { captureError } from "../services/observability-service.js";

const EMPTY_NOTIFICATIONS = Object.freeze([]);
let notificationServicePromise;

function loadNotificationService() {
    notificationServicePromise ??=
        import("../services/notification-service.js");
    return notificationServicePromise;
}

export function NotificationProvider({ children }) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const { settings } = useSettings();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(Boolean(user?.uid));
    const [error, setError] = useState(null);
    const initializedRef = useRef(false);
    const knownIdsRef = useRef(new Set());
    const notificationsEnabledRef = useRef(settings.notifications.enabled);
    const userId = user?.uid;

    useEffect(() => {
        notificationsEnabledRef.current = settings.notifications.enabled;
    }, [settings.notifications.enabled]);

    useEffect(() => {
        if (!userId) {
            return undefined;
        }
        initializedRef.current = false;
        knownIdsRef.current = new Set();
        let active = true;
        let unsubscribe = () => {};

        void loadNotificationService().then(({ listenToNotifications }) => {
            if (!active) return;
            unsubscribe = listenToNotifications(
                userId,
                (next) => {
                    if (initializedRef.current) {
                        const incoming = next.find(
                            (item) =>
                                !item.read && !knownIdsRef.current.has(item.id)
                        );
                        if (incoming && notificationsEnabledRef.current) {
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
                    captureError(nextError, { feature: "notifications" });
                    setError(nextError);
                    setLoading(false);
                }
            );
        });

        return () => {
            active = false;
            unsubscribe();
        };
    }, [showToast, userId]);

    const setRead = useCallback(
        async (id, read) => {
            const { markNotification } = await loadNotificationService();
            return markNotification(userId, id, read);
        },
        [userId]
    );
    const markAllRead = useCallback(async () => {
        const { markAllNotificationsRead } = await loadNotificationService();
        return markAllNotificationsRead(userId);
    }, [userId]);
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
