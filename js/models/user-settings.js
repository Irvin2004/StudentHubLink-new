"use strict";

import {
    SETTINGS_DEFAULTS,
    ALLOWED_THEMES,
    ALLOWED_FONT_SIZES
} from "../config/settings-defaults.js";

const BOOLEAN_FIELDS = Object.freeze([
    "notificationsEnabled",
    "compactMode",
    "messagePreview",
    "reducedMotion",
    "highContrast"
]);

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

    return true;
}

export function createUserSettings(data = {}) {
    const settings = {
        ...SETTINGS_DEFAULTS,
        ...data
    };

    validateUserSettings(settings);

    return settings;
}

export function mergeUserSettings(currentSettings, updates) {
    return createUserSettings({
        ...currentSettings,
        ...updates
    });
}
