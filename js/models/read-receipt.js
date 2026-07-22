"use strict";

function normalizeText(value) {
    return String(value || "").trim();
}

export function validateReadReceipt(receipt = {}) {
    const errors = {};
    const conversationId = normalizeText(receipt.conversationId);
    const messageId = normalizeText(receipt.messageId);
    const userId = normalizeText(receipt.userId);

    if (!conversationId) {
        errors.conversationId = "Conversation ID is required.";
    }

    if (!messageId) {
        errors.messageId = "Message ID is required.";
    }

    if (!userId) {
        errors.userId = "User ID is required.";
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

export function createReadReceiptModel(receipt = {}) {
    const normalizedReceipt = {
        conversationId: normalizeText(receipt.conversationId),
        messageId: normalizeText(receipt.messageId),
        userId: normalizeText(receipt.userId),
        readAt: null
    };
    const validation = validateReadReceipt(normalizedReceipt);

    if (!validation.isValid) {
        const error = new Error("Invalid read receipt data.");
        error.validationErrors = validation.errors;
        throw error;
    }

    return normalizedReceipt;
}
