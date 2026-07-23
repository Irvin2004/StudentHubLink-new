"use strict";

import {
    MESSAGE_TYPES,
    isValidMessageType
} from "../config/message-types.js";

function normalizeText(value) {
    return String(value ?? "").trim();
}

function normalizeOptionalId(value) {
    const normalized = normalizeText(value);
    return normalized || null;
}

function normalizeNumber(value) {
    const normalized = Number(value);
    return Number.isFinite(normalized) ? normalized : -1;
}

function normalizeVoice(voice = {}) {
    return {
        url: normalizeText(voice.url),
        storagePath: normalizeText(voice.storagePath),
        duration: normalizeNumber(voice.duration),
        size: normalizeNumber(voice.size),
        mimeType: normalizeText(voice.mimeType).toLowerCase()
    };
}

function normalizeReply(reply = {}) {
    return {
        messageId: normalizeText(reply.messageId),
        senderId: normalizeText(reply.senderId),
        preview: normalizeText(reply.preview),
        type: normalizeText(reply.type)
    };
}

export function validateMessage(message = {}) {
    const errors = {};
    const conversationId = normalizeText(message.conversationId);
    const senderId = normalizeText(message.senderId);
    const type = normalizeText(message.type);
    const content = normalizeText(message.content ?? message.text);

    if (!conversationId) {
        errors.conversationId = "Conversation ID is required.";
    }

    if (!senderId) {
        errors.senderId = "Sender ID is required.";
    }

    if (!isValidMessageType(type)) {
        errors.type = "A valid message type is required.";
    }

    if (
        (type === MESSAGE_TYPES.TEXT || type === MESSAGE_TYPES.SYSTEM) &&
        !content
    ) {
        errors.content = "Message content is required.";
    }

    if (type === MESSAGE_TYPES.VOICE) {
        const voice = normalizeVoice(message.voice);

        if (!voice.storagePath) {
            errors.voiceStoragePath =
                "Voice message storage path is required.";
        }

        if (voice.duration < 0) {
            errors.voiceDuration =
                "Voice message duration must be zero or greater.";
        }

        if (voice.size < 0) {
            errors.voiceSize =
                "Voice message size must be zero or greater.";
        }

        if (!voice.mimeType.startsWith("audio/")) {
            errors.voiceMimeType =
                "A valid voice message MIME type is required.";
        }
    }

    if (message.reply !== undefined && message.reply !== null) {
        const reply = normalizeReply(message.reply);

        if (!reply.messageId) {
            errors.replyMessageId = "Reply message ID is required.";
        }

        if (!reply.senderId) {
            errors.replySenderId = "Reply sender ID is required.";
        }

        if (!reply.preview) {
            errors.replyPreview = "Reply preview is required.";
        }

        if (!isValidMessageType(reply.type)) {
            errors.replyType = "A valid reply message type is required.";
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

export function createMessageModel(message = {}) {
    const type = normalizeText(message.type) || MESSAGE_TYPES.TEXT;
    const reply = message.reply === undefined || message.reply === null
        ? null
        : normalizeReply(message.reply);
    const normalizedMessage = {
        id: normalizeText(message.id),
        conversationId: normalizeText(message.conversationId),
        senderId: normalizeText(message.senderId),
        receiverId: normalizeOptionalId(message.receiverId),
        groupId: normalizeOptionalId(message.groupId),
        type,
        content: normalizeText(message.content ?? message.text),
        voice: type === MESSAGE_TYPES.VOICE
            ? normalizeVoice(message.voice)
            : null,
        ...(reply ? { reply } : {})
    };
    const validation = validateMessage(normalizedMessage);

    if (!validation.isValid) {
        const error = new Error("Invalid message data.");
        error.validationErrors = validation.errors;
        throw error;
    }

    return normalizedMessage;
}
