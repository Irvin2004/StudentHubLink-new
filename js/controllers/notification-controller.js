import { NOTIFICATION_TYPES } from "../config/notification-types.js";
import { createNotificationPanel } from "../components/notification-panel.js";
import { renderNotifications } from "../renderers/notification-renderer.js";
import {
    markAllAsRead,
    markAsRead,
    subscribeToNotifications
} from "../services/notification-service.js";
import { error as logError } from "../utils/logger.js";

function updateNotificationBadge(
    notifications,
    badge,
    bellButton,
    markAllButton
) {
    const unreadCount = notifications.filter(
        (notification) => !notification.read
    ).length;

    badge.textContent = unreadCount > 99
        ? "99+"
        : String(unreadCount);
    badge.hidden = unreadCount === 0;
    markAllButton.disabled = unreadCount === 0;

    bellButton.setAttribute(
        "aria-label",
        unreadCount
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
    );
}

function getPagesPrefix() {
    const pathname = window.location.pathname;

    if (pathname.includes("/Admin/")) {
        return "../pages/";
    }

    if (pathname.includes("/pages/")) {
        return "";
    }

    return "pages/";
}

function getNotificationDestination(notification) {
    const pagesPrefix = getPagesPrefix();
    const groupId = encodeURIComponent(notification.groupId || "");
    const referenceId = encodeURIComponent(
        notification.referenceId || ""
    );
    const senderId = encodeURIComponent(notification.senderId || "");
    const conversationId = encodeURIComponent(
        notification.conversationId || ""
    );

    switch (notification.type) {
        case NOTIFICATION_TYPES.NEW_ASSIGNMENT:
        case NOTIFICATION_TYPES.ASSIGNMENT_DUE:
            return notification.groupId
                ? `${pagesPrefix}group-assignments.html?id=${groupId}`
                : `${pagesPrefix}groups.html`;

        case NOTIFICATION_TYPES.NEW_MESSAGE:
        case NOTIFICATION_TYPES.MENTION:
            return notification.conversationId
                ? `${pagesPrefix}chat.html?id=${conversationId}` +
                    (notification.referenceId
                        ? `&message=${referenceId}`
                        : "")
                : `${pagesPrefix}messages.html`;

        case NOTIFICATION_TYPES.NEW_RESOURCE:
            return notification.referenceId
                ? `${pagesPrefix}resource-details.html?id=${referenceId}`
                : `${pagesPrefix}resources.html`;

        case NOTIFICATION_TYPES.FRIEND_REQUEST:
        case NOTIFICATION_TYPES.FRIEND_ACCEPTED:
            return notification.senderId
                ? `${pagesPrefix}user-profile.html?id=${senderId}`
                : `${pagesPrefix}profile.html`;

        case NOTIFICATION_TYPES.GROUP_INVITE:
            return notification.groupId
                ? `${pagesPrefix}group-details.html?id=${groupId}`
                : `${pagesPrefix}groups.html`;

        default:
            return null;
    }
}

function openNotification(notification) {
    const destination = getNotificationDestination(notification);

    if (destination) {
        window.location.assign(destination);
    }
}

export async function initialiseNotifications({
    userId,
    bellButton,
    panelContainer
} = {}) {
    const panel = createNotificationPanel({
        bellButton,
        panelContainer
    });
    let notifications = [];
    let unsubscribe = () => {};
    let destroyed = false;

    panel.setLoading();

    const handleNotificationsUpdate = (nextNotifications) => {
        notifications = nextNotifications;
        panel.list.setAttribute("aria-busy", "false");
        renderNotifications(notifications, panel.list);
        updateNotificationBadge(
            notifications,
            panel.badge,
            bellButton,
            panel.markAllButton
        );
    };

    const handleSubscriptionError = (error) => {
        panel.showError(
            "Notifications are unavailable right now. Please try again."
        );
        panel.badge.hidden = true;
        panel.markAllButton.disabled = true;
        logError("NOTIFICATIONS", "Subscription failed:", error);
    };

    const handleMarkAllClick = async () => {
        if (!notifications.some((notification) => !notification.read)) {
            return;
        }

        panel.markAllButton.disabled = true;

        try {
            await markAllAsRead(userId);
        } catch (error) {
            panel.markAllButton.disabled = false;
            logError("NOTIFICATIONS", "Could not mark all as read:", error);
        }
    };

    const handleNotificationClick = async (event) => {
        const notificationElement = event.target.closest(
            "[data-notification-id]"
        );

        if (!notificationElement || !panel.list.contains(notificationElement)) {
            return;
        }

        const notification = notifications.find(
            (item) => item.id === notificationElement.dataset.notificationId
        );

        if (!notification) {
            return;
        }

        if (!notification.read) {
            try {
                await markAsRead(userId, notification.id);
            } catch (error) {
                logError("NOTIFICATIONS", "Could not mark as read:", error);
            }
        }

        openNotification(notification);
    };

    panel.markAllButton.addEventListener("click", handleMarkAllClick);
    panel.list.addEventListener("click", handleNotificationClick);

    try {
        unsubscribe = subscribeToNotifications(
            userId,
            handleNotificationsUpdate,
            handleSubscriptionError
        );
    } catch (error) {
        handleSubscriptionError(error);
    }

    const destroy = () => {
        if (destroyed) {
            return;
        }

        destroyed = true;
        unsubscribe();
        panel.markAllButton.removeEventListener(
            "click",
            handleMarkAllClick
        );
        panel.list.removeEventListener(
            "click",
            handleNotificationClick
        );
        window.removeEventListener("pagehide", destroy);
        panel.destroy();
    };

    window.addEventListener("pagehide", destroy, { once: true });
    return destroy;
}
