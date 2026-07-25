import { MESSAGE_MAX_LENGTH, MESSAGE_TYPES } from "../config/message-types.js";

function normalizeText(value) {
    return String(value ?? "").trim();
}

function normalizeReply(replyTo) {
    if (!replyTo) return null;

    const id = normalizeText(replyTo.id || replyTo.messageId);
    if (!id) throw new TypeError("A reply message ID is required.");

    return {
        id,
        senderId: normalizeText(replyTo.senderId),
        senderName: normalizeText(replyTo.senderName) || "Student",
        text: normalizeText(replyTo.text).slice(0, 180)
    };
}

export function validateMessageInput(input = {}) {
    const text = normalizeText(input.text);
    const attachments = Array.isArray(input.attachments)
        ? input.attachments
        : [];

    if (!normalizeText(input.communityId)) {
        throw new TypeError("A community ID is required.");
    }

    if (!normalizeText(input.channelId)) {
        throw new TypeError("A channel ID is required.");
    }

    if (!normalizeText(input.senderId)) {
        throw new TypeError("A sender ID is required.");
    }

    if (!text && attachments.length === 0) {
        throw new TypeError("Message cannot be empty.");
    }

    if (text.length > MESSAGE_MAX_LENGTH) {
        throw new TypeError(
            `Message cannot exceed ${MESSAGE_MAX_LENGTH} characters.`
        );
    }

    return {
        communityId: normalizeText(input.communityId),
        channelId: normalizeText(input.channelId),
        senderId: normalizeText(input.senderId),
        senderName: normalizeText(input.senderName) || "Student",
        senderPhotoURL: normalizeText(input.senderPhotoURL) || null,
        text,
        attachments,
        replyTo: normalizeReply(input.replyTo)
    };
}

export function createMessageModel(input = {}) {
    return {
        id: normalizeText(input.id),
        communityId: normalizeText(input.communityId),
        channelId: normalizeText(input.channelId),
        senderId: normalizeText(input.senderId),
        senderName: normalizeText(input.senderName) || "Student",
        senderPhotoURL: normalizeText(input.senderPhotoURL) || null,
        text: input.deleted ? "" : String(input.text ?? ""),
        attachments: Array.isArray(input.attachments) ? input.attachments : [],
        replyTo: input.replyTo || null,
        type: input.type || MESSAGE_TYPES.TEXT,
        reactions:
            input.reactions && typeof input.reactions === "object"
                ? input.reactions
                : {},
        edited: input.edited === true,
        deleted: input.deleted === true,
        deletedAt: input.deletedAt || null,
        readBy: Array.isArray(input.readBy) ? input.readBy : [],
        createdAt: input.createdAt || null,
        updatedAt: input.updatedAt || null
    };
}
