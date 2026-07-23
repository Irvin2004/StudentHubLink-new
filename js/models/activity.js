"use strict";

import { isValidActivityType } from "../config/activity-types.js";

function normalizeText(value) {
    return String(value || "").trim();
}

export function validateActivity(activity = {}) {
    const errors = {};

    const actorId = normalizeText(activity.actorId);
    const type = normalizeText(activity.type);
    const title = normalizeText(activity.title);

    if (!actorId) {
        errors.actorId = "Activity actor ID is required.";
    }

    if (!isValidActivityType(type)) {
        errors.type = "A valid activity type is required.";
    }

    if (!title) {
        errors.title = "Activity title is required.";
    }

    if (title.length > 160) {
        errors.title = "Activity title cannot exceed 160 characters.";
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

export function createActivityModel(activity = {}) {
    const validation = validateActivity(activity);

    if (!validation.isValid) {
        const error = new Error("Invalid activity data.");
        error.validationErrors = validation.errors;
        throw error;
    }

    return {
        type: normalizeText(activity.type),
        actorId: normalizeText(activity.actorId),
        actorName: normalizeText(activity.actorName),

        title: normalizeText(activity.title),
        description: normalizeText(activity.description),

        groupId: normalizeText(activity.groupId),
        referenceId: normalizeText(activity.referenceId),

        visibility: normalizeText(activity.visibility) || "group",

        metadata: {
            ...(activity.metadata || {})
        }
    };
}
