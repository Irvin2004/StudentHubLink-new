"use strict";

function normalizeId(value) {
    return String(value || "").trim();
}

export function validateConversationPreference(preference = {}) {
    const errors = {};

    if (!normalizeId(preference.conversationId)) {
        errors.conversationId = "Conversation ID is required.";
    }

    if (!normalizeId(preference.userId)) {
        errors.userId = "User ID is required.";
    }

    ["pinned", "muted", "archived"].forEach((field) => {
        if (typeof preference[field] !== "boolean") {
            errors[field] = `${field} must be a boolean.`;
        }
    });

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

export function createConversationPreferenceModel(preference = {}) {
    const normalizedPreference = {
        conversationId: normalizeId(preference.conversationId),
        userId: normalizeId(preference.userId),
        pinned: preference.pinned ?? false,
        muted: preference.muted ?? false,
        archived: preference.archived ?? false,
        createdAt: preference.createdAt || null,
        updatedAt: preference.updatedAt || null
    };
    const validation = validateConversationPreference(normalizedPreference);

    if (!validation.isValid) {
        const error = new Error("Invalid conversation preference data.");
        error.validationErrors = validation.errors;
        throw error;
    }

    return normalizedPreference;
}
