"use strict";

import {
    PRESENCE_STATUS,
    isValidPresenceStatus
} from "../config/presence-status.js";

function normalizeText(value) {
    return String(value || "").trim();
}

export function validatePresence(presence = {}) {
    const errors = {};

    const userId = normalizeText(presence.userId);
    const status = normalizeText(presence.status);

    if (!userId) {
        errors.userId = "User ID is required.";
    }

    if (!isValidPresenceStatus(status)) {
        errors.status = "A valid presence status is required.";
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

export function createPresenceModel(presence = {}) {
    const normalizedPresence = {
        userId: normalizeText(presence.userId),

        userName: normalizeText(presence.userName),

        status: normalizeText(presence.status) || PRESENCE_STATUS.OFFLINE,

        conversationId: normalizeText(presence.conversationId),

        lastSeen: presence.lastSeen || null,

        updatedAt: presence.updatedAt || null
    };

    const validation = validatePresence(normalizedPresence);

    if (!validation.isValid) {
        const error = new Error("Invalid presence data.");

        error.validationErrors = validation.errors;

        throw error;
    }

    return normalizedPresence;
}
