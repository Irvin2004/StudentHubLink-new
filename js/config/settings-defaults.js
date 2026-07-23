"use strict";

export const SETTINGS_DEFAULTS = Object.freeze({
    theme: "system",
    notificationsEnabled: true,
    compactMode: false,
    messagePreview: true,
    fontSize: "medium",
    reducedMotion: false,
    highContrast: false
});

export const ALLOWED_THEMES = Object.freeze([
    "light",
    "dark",
    "system"
]);

export const ALLOWED_FONT_SIZES = Object.freeze([
    "small",
    "medium",
    "large"
]);
