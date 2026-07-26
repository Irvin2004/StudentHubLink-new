"use strict";

import {
    SETTINGS_DEFAULTS,
    NOTIFICATION_DEFAULTS,
    ALLOWED_THEMES,
    ALLOWED_FONT_SIZES
} from "../config/settings-defaults.js";

const BOOLEAN_FIELDS = Object.freeze([
    "compactMode",
    "messagePreview",
    "reducedMotion",
    "highContrast"
]);

const NOTIFICATION_BOOLEAN_FIELDS = Object.freeze(
    Object.keys(NOTIFICATION_DEFAULTS)
);

export function validateUserSettings(settings) {
    if (!settings || typeof settings !== "object") {
        throw new TypeError("User settings must be an object.");
    }

    if (!ALLOWED_THEMES.includes(settings.theme)) {
        throw new Error(`Invalid theme: ${settings.theme}`);
    }

    if (!ALLOWED_FONT_SIZES.includes(settings.fontSize)) {
        throw new Error(`Invalid font size: ${settings.fontSize}`);
    }

    for (const field of BOOLEAN_FIELDS) {
        if (typeof settings[field] !== "boolean") {
            throw new TypeError(`${field} must be a boolean.`);
        }
    }

    if (
        !settings.notifications ||
        typeof settings.notifications !== "object" ||
        Array.isArray(settings.notifications)
    ) {
        throw new TypeError("notifications must be an object.");
    }

    for (const field of NOTIFICATION_BOOLEAN_FIELDS) {
        if (typeof settings.notifications[field] !== "boolean") {
            throw new TypeError(`notifications.${field} must be a boolean.`);
        }
    }

    return true;
}

export function createUserSettings(data = {}) {
    const { notificationsEnabled, notifications, ...otherSettings } =
        data || {};
    const mergedNotifications = {
        ...NOTIFICATION_DEFAULTS,
        ...(notifications || {})
    };

    if (
        typeof notificationsEnabled === "boolean" &&
        typeof notifications?.enabled !== "boolean"
    ) {
        mergedNotifications.enabled = notificationsEnabled;
    }

    const settings = {
        ...SETTINGS_DEFAULTS,
        ...otherSettings,
        notifications: mergedNotifications
    };

    validateUserSettings(settings);

    return settings;
}

export function mergeUserSettings(currentSettings, updates) {
    return createUserSettings({
        ...currentSettings,
        ...updates,
        notifications: {
            ...currentSettings?.notifications,
            ...updates?.notifications
        }
    });
}
