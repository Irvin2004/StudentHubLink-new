import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { NotificationContext } from "./notification-context.js";
import { useAuth } from "../hooks/useAuth.js";
import { useToast } from "../hooks/useToast.js";
import { useSettings } from "../hooks/useSettings.js";
import { captureError } from "../services/observability-service.js";

const EMPTY_NOTIFICATIONS = Object.freeze([]);
const RETRY_DELAY_MS = 1000;
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
    const [loadingOlderNotifications, setLoadingOlderNotifications] =
        useState(false);
    const [hasMoreNotifications, setHasMoreNotifications] = useState(false);
    const [error, setError] = useState(null);
    const initializedRef = useRef(false);
    const knownIdsRef = useRef(new Set());
    const notificationsEnabledRef = useRef(settings.notifications.enabled);
    const oldestCursorRef = useRef(null);
    const hasLoadedOlderRef = useRef(false);
    const retrySubscriptionRef = useRef(() => {});
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
        oldestCursorRef.current = null;
        hasLoadedOlderRef.current = false;
        let active = true;
        let unsubscribe = () => {};
        let retryTimer = null;

        void loadNotificationService().then(
            ({ listenToNotifications, mergeNotificationPages }) => {
                if (!active) return;
                setNotifications([]);
                setHasMoreNotifications(false);
                setLoadingOlderNotifications(false);
                const subscribe = () => {
                    if (!active) return;
                    setLoading(true);
                    unsubscribe = listenToNotifications(
                        userId,
                        (next, page) => {
                            if (initializedRef.current) {
                                const incoming = next.find(
                                    (item) =>
                                        !item.read &&
                                        !knownIdsRef.current.has(item.id)
                                );
                                if (
                                    incoming &&
                                    notificationsEnabledRef.current
                                ) {
                                    showToast({
                                        title: incoming.title,
                                        message: incoming.message,
                                        type: incoming.type.includes("mention")
                                            ? "info"
                                            : "success"
                                    });
                                }
                            }
                            knownIdsRef.current = new Set(
                                next.map((item) => item.id)
                            );
                            if (!hasLoadedOlderRef.current) {
                                oldestCursorRef.current = page.cursor;
                            }
                            initializedRef.current = true;
                            setHasMoreNotifications(page.hasMore);
                            setNotifications((current) =>
                                mergeNotificationPages(next, current)
                            );
                            setError(null);
                            setLoading(false);
                        },
                        (nextError) => {
                            captureError(nextError, {
                                feature: "notifications"
                            });
                            setError(nextError);
                            setLoading(false);
                            unsubscribe();
                            retryTimer = window.setTimeout(
                                subscribe,
                                RETRY_DELAY_MS
                            );
                        }
                    );
                };

                subscribe();
                retrySubscriptionRef.current = () => {
                    window.clearTimeout(retryTimer);
                    unsubscribe();
                    setError(null);
                    subscribe();
                };
            }
        );

        return () => {
            active = false;
            window.clearTimeout(retryTimer);
            unsubscribe();
            retrySubscriptionRef.current = () => {};
        };
    }, [showToast, userId]);

    const setRead = useCallback(
        async (id, read) => {
            let previousNotifications;
            setNotifications((current) => {
                previousNotifications = current;
                return current.map((item) =>
                    item.id === id ? { ...item, read } : item
                );
            });

            try {
                const { markNotification } = await loadNotificationService();
                await markNotification(userId, id, read);
                return true;
            } catch (nextError) {
                setNotifications(previousNotifications);
                setError(nextError);
                captureError(nextError, { feature: "notifications" });
                showToast({
                    title: "Notification update failed",
                    message:
                        "We couldn't update your notification. Please try again.",
                    type: "error"
                });
                return false;
            }
        },
        [showToast, userId]
    );
    const markAllRead = useCallback(async () => {
        let previousNotifications;
        setNotifications((current) => {
            previousNotifications = current;
            return current.map((item) => ({ ...item, read: true }));
        });

        try {
            const { markAllNotificationsRead } =
                await loadNotificationService();
            await markAllNotificationsRead(userId);
            return true;
        } catch (nextError) {
            setNotifications(previousNotifications);
            setError(nextError);
            captureError(nextError, { feature: "notifications" });
            showToast({
                title: "Notification update failed",
                message:
                    "We couldn't mark all notifications as read. Please try again.",
                type: "error"
            });
            return false;
        }
    }, [showToast, userId]);
    const loadOlder = useCallback(async () => {
        const cursor = oldestCursorRef.current;
        if (!userId || !cursor || loadingOlderNotifications) return false;

        setLoadingOlderNotifications(true);
        try {
            const { loadOlderNotifications, mergeNotificationPages } =
                await loadNotificationService();
            const page = await loadOlderNotifications(userId, cursor);

            oldestCursorRef.current = page.cursor;
            hasLoadedOlderRef.current = true;
            setHasMoreNotifications(page.hasMore);
            setNotifications((current) =>
                mergeNotificationPages(current, page.notifications)
            );
            return true;
        } catch (nextError) {
            setError(nextError);
            captureError(nextError, { feature: "notifications" });
            showToast({
                title: "Notifications unavailable",
                message:
                    "We couldn't load older notifications. Please try again.",
                type: "error"
            });
            return false;
        } finally {
            setLoadingOlderNotifications(false);
        }
    }, [loadingOlderNotifications, showToast, userId]);
    const retryNotifications = useCallback(
        () => retrySubscriptionRef.current(),
        []
    );
    const visibleNotifications = userId ? notifications : EMPTY_NOTIFICATIONS;
    const unreadCount = visibleNotifications.reduce(
        (count, item) => count + (item.read ? 0 : 1),
        0
    );
    const value = useMemo(
        () => ({
            error,
            hasMoreNotifications,
            loadOlder,
            loading: userId ? loading : false,
            loadingOlderNotifications,
            markAllRead,
            notifications: visibleNotifications,
            retryNotifications,
            setRead,
            unreadCount
        }),
        [
            error,
            hasMoreNotifications,
            loadOlder,
            loading,
            loadingOlderNotifications,
            markAllRead,
            setRead,
            retryNotifications,
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
