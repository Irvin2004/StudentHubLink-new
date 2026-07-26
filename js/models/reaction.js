"use strict";

import { isValidReaction } from "../config/reaction-types.js";

function normalizeText(value) {
    return String(value || "").trim();
}

export function validateReaction(reactionData = {}) {
    const errors = {};
    const messageId = normalizeText(reactionData.messageId);
    const userId = normalizeText(reactionData.userId);
    const reaction = normalizeText(reactionData.reaction);

    if (!messageId) {
        errors.messageId = "Message ID is required.";
    }

    if (!userId) {
        errors.userId = "User ID is required.";
    }

    if (!isValidReaction(reaction)) {
        errors.reaction = "A valid reaction is required.";
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

export function createReactionModel(reactionData = {}) {
    const normalizedReaction = {
        messageId: normalizeText(reactionData.messageId),
        userId: normalizeText(reactionData.userId),
        reaction: normalizeText(reactionData.reaction)
    };
    const validation = validateReaction(normalizedReaction);

    if (!validation.isValid) {
        const error = new Error("Invalid reaction data.");
        error.validationErrors = validation.errors;
        throw error;
    }

    return normalizedReaction;
}
