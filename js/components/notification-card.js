import { escapeHtml } from "../utils/dom.js";
import { formatDate } from "../utils/format-date.js";

export function createNotificationCard(notification) {
    const isRead =
    Boolean(notification.read);

    return `
        <article
            class="notification-card notification-item ${isRead ? "" : "unread"}"
            data-notification-id="${escapeHtml(notification.id || "")}"
            data-unread="${isRead ? "false" : "true"}"
        >
            <div class="notification-content">
                <h4>${escapeHtml(notification.title || "Notification")}</h4>
                <p>${escapeHtml(notification.message || "")}</p>
                <small class="notification-time">
                    ${escapeHtml(formatDate(notification.createdAt, { fallback: "" }))}
                </small>
            </div>
        </article>
    `;
}
