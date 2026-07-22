import { NOTIFICATION_TYPES } from "../config/notification-types.js";

const TITLE_MAX_LENGTH = 120;
const MESSAGE_MAX_LENGTH = 500;
const VALID_TYPES = new Set(Object.values(NOTIFICATION_TYPES));

function validateTitle(title) {
    if (typeof title !== "string" || !title.trim()) {
        throw new Error("Title is required.");
    }

    const cleanTitle = title.trim();

    if (cleanTitle.length > TITLE_MAX_LENGTH) {
        throw new Error(
            `Title cannot exceed ${TITLE_MAX_LENGTH} characters.`
        );
    }

    return cleanTitle;
}

function validateMessage(message) {
    if (typeof message !== "string" || !message.trim()) {
        throw new Error("Message is required.");
    }

    const cleanMessage = message.trim();

    if (cleanMessage.length > MESSAGE_MAX_LENGTH) {
        throw new Error(
            `Message cannot exceed ${MESSAGE_MAX_LENGTH} characters.`
        );
    }

    return cleanMessage;
}

function validateRecipientId(recipientId) {
    if (typeof recipientId !== "string" || !recipientId.trim()) {
        throw new Error("Recipient ID is required.");
    }

    return recipientId.trim();
}

function validateType(type) {
    const cleanType = typeof type === "string" ? type.trim() : "";

    if (!VALID_TYPES.has(cleanType)) {
        throw new Error("Invalid notification type.");
    }

    return cleanType;
}

function normalizeOptionalId(value, fieldName) {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    if (typeof value !== "string") {
        throw new Error(`${fieldName} must be text.`);
    }

    return value.trim() || null;
}

export function validateNotification(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("Notification data is required.");
    }

    return {
        type: validateType(data.type),
        title: validateTitle(data.title),
        message: validateMessage(data.message),
        recipientId: validateRecipientId(data.recipientId),
        senderId: normalizeOptionalId(data.senderId, "Sender ID"),
        groupId: normalizeOptionalId(data.groupId, "Group ID"),
        conversationId: normalizeOptionalId(
            data.conversationId,
            "Conversation ID"
        ),
        referenceId: normalizeOptionalId(
            data.referenceId,
            "Reference ID"
        )
    };
}

export function createNotificationModel(data) {
    return {
        ...validateNotification(data),
        read: false
    };
}
