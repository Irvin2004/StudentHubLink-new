"use strict";

export const NOTIFICATION_DEFAULTS = Object.freeze({
    enabled: true,
    directMessages: true,
    groupMessages: true,
    mentions: true,
    reactions: false,
    readReceipts: false
});

export const SETTINGS_DEFAULTS = Object.freeze({
    theme: "system",
    notifications: NOTIFICATION_DEFAULTS,
    compactMode: false,
    messagePreview: true,
    fontSize: "medium",
    reducedMotion: false,
    highContrast: false
});

export const ALLOWED_THEMES = Object.freeze(["light", "dark", "system"]);

export const ALLOWED_FONT_SIZES = Object.freeze(["small", "medium", "large"]);
