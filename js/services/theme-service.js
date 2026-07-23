"use strict";

import { THEMES } from "../config/theme-config.js";

const THEME_STORAGE_KEY = "studenthub-theme";
const SETTINGS_CHANGE_EVENT = "studenthub:settings-changed";
const SYSTEM_THEME_QUERY = "(prefers-color-scheme: dark)";

let currentTheme = THEMES.SYSTEM;
let systemThemeQuery = null;
let initialized = false;

function isValidTheme(theme) {
    return Object.values(THEMES).includes(theme);
}

function getSystemTheme() {
    const query = systemThemeQuery ||
        window.matchMedia(SYSTEM_THEME_QUERY);

    return query.matches ? THEMES.DARK : THEMES.LIGHT;
}

function resolveTheme(theme) {
    return theme === THEMES.SYSTEM
        ? getSystemTheme()
        : theme;
}

function saveTheme(theme) {
    try {
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
        console.warn("Unable to save theme preference:", error);
    }
}

function getSavedTheme() {
    try {
        const savedTheme = window.localStorage.getItem(
            THEME_STORAGE_KEY
        );

        return isValidTheme(savedTheme)
            ? savedTheme
            : THEMES.SYSTEM;
    } catch (error) {
        console.warn("Unable to read theme preference:", error);
        return THEMES.SYSTEM;
    }
}

function applyResolvedTheme(theme) {
    document.documentElement.setAttribute(
        "data-theme",
        resolveTheme(theme)
    );
}

function handleSystemThemeChange() {
    if (currentTheme === THEMES.SYSTEM) {
        applyResolvedTheme(currentTheme);
    }
}

function handleSettingsChange(event) {
    const theme = event.detail?.theme;

    if (isValidTheme(theme)) {
        applyTheme(theme);
    }
}

export function applyTheme(theme) {
    if (!isValidTheme(theme)) {
        throw new Error(`Unsupported theme: ${theme}`);
    }

    currentTheme = theme;
    applyResolvedTheme(theme);
    saveTheme(theme);

    return resolveTheme(theme);
}

export function getCurrentTheme() {
    return currentTheme;
}

export function initializeTheme() {
    if (initialized) {
        return currentTheme;
    }

    systemThemeQuery = window.matchMedia(SYSTEM_THEME_QUERY);

    if (systemThemeQuery.addEventListener) {
        systemThemeQuery.addEventListener(
            "change",
            handleSystemThemeChange
        );
    } else {
        systemThemeQuery.addListener(handleSystemThemeChange);
    }

    document.addEventListener(
        SETTINGS_CHANGE_EVENT,
        handleSettingsChange
    );

    initialized = true;
    applyTheme(getSavedTheme());

    return currentTheme;
}

export function destroy() {
    if (!initialized) {
        return;
    }

    document.removeEventListener(
        SETTINGS_CHANGE_EVENT,
        handleSettingsChange
    );

    if (systemThemeQuery?.removeEventListener) {
        systemThemeQuery.removeEventListener(
            "change",
            handleSystemThemeChange
        );
    } else {
        systemThemeQuery?.removeListener(handleSystemThemeChange);
    }

    systemThemeQuery = null;
    initialized = false;
}
