import { NOTIFICATION_TYPES } from "../config/notification-types.js";
import { escapeHtml } from "../utils/dom.js";
import { formatTimeAgo } from "../utils/time-ago.js";

function getNotificationIcon(type) {
    switch (type) {
        case NOTIFICATION_TYPES.NEW_ASSIGNMENT:
            return "&#128221;";
        case NOTIFICATION_TYPES.ASSIGNMENT_DUE:
            return "&#9200;";
        case NOTIFICATION_TYPES.NEW_RESOURCE:
            return "&#128218;";
        case NOTIFICATION_TYPES.NEW_MESSAGE:
            return "&#128172;";
        case NOTIFICATION_TYPES.FRIEND_REQUEST:
        case NOTIFICATION_TYPES.GROUP_INVITE:
            return "&#128101;";
        case NOTIFICATION_TYPES.FRIEND_ACCEPTED:
            return "&#9989;";
        case NOTIFICATION_TYPES.MENTION:
            return "@";
        default:
            return "&#128276;";
    }
}

function renderEmptyState() {
    return `
        <div class="notification-empty-state">
            <span class="notification-empty-icon" aria-hidden="true">
                &#128276;
            </span>
            <strong>You're all caught up.</strong>
            <p>No notifications yet.</p>
        </div>
    `;
}

export function renderNotifications(notifications, container) {
    if (!container || !("innerHTML" in container)) {
        throw new Error("Notification container is required.");
    }

    const cleanNotifications = Array.isArray(notifications)
        ? notifications
        : [];
    const html = cleanNotifications.length
        ? cleanNotifications.map(renderNotificationItem).join("")
        : renderEmptyState();

    container.innerHTML = html;
    return html;
}

export function renderNotificationItem(notification = {}) {
    const isUnread = notification.read !== true;
    const stateClass = isUnread
        ? "notification-unread"
        : "notification-read";
    const stateLabel = isUnread ? "&#9679; Unread" : "Read";

    return `
        <article
            class="notification-card ${stateClass}"
            data-notification-id="${escapeHtml(notification.id || "")}"
            data-notification-type="${escapeHtml(notification.type || "")}"
            data-unread="${isUnread}"
        >
            <header class="notification-header">
                <span class="notification-icon" aria-hidden="true">
                    ${getNotificationIcon(notification.type)}
                </span>
                <h3>${escapeHtml(notification.title || "Notification")}</h3>
            </header>

            <div class="notification-body">
                <p>${escapeHtml(notification.message || "")}</p>
            </div>

            <footer class="notification-footer">
                <time>${escapeHtml(formatTimeAgo(notification.createdAt))}</time>
                <span class="notification-state">${stateLabel}</span>
            </footer>
        </article>
    `;
}
