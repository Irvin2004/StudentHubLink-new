import { NOTIFICATION_TYPES } from "../config/notification-types.js";

const TYPES = new Set(Object.values(NOTIFICATION_TYPES));

export function createNotificationModel(input = {}) {
    const type = String(input.type || "").trim();
    const title = String(input.title || "").trim();
    const message = String(input.message || "").trim();
    if (!String(input.id || "").trim()) {
        throw new TypeError("A notification ID is required.");
    }
    if (!TYPES.has(type)) throw new TypeError("Invalid notification type.");
    if (!title || !message) {
        throw new TypeError("Notification title and message are required.");
    }

    return {
        id: String(input.id),
        recipientId: String(input.recipientId || ""),
        senderId: String(input.senderId || ""),
        senderName: String(input.senderName || "Student"),
        type,
        title,
        message,
        read: Boolean(input.read),
        communityId: String(input.communityId || ""),
        channelId: String(input.channelId || ""),
        referenceId: String(input.referenceId || ""),
        route: String(input.route || ""),
        createdAt: input.createdAt || null,
        updatedAt: input.updatedAt || null
    };
}
