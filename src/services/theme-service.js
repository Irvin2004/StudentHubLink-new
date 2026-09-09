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
    const query = systemThemeQuery || window.matchMedia(SYSTEM_THEME_QUERY);

    return query.matches ? THEMES.DARK : THEMES.LIGHT;
}

function resolveTheme(theme) {
    return theme === THEMES.SYSTEM ? getSystemTheme() : theme;
}

function saveTheme(theme) {
    try {
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
        // Storage can be unavailable in privacy modes; the applied theme remains valid.
    }
}

function getSavedTheme() {
    try {
        const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

        return isValidTheme(savedTheme) ? savedTheme : THEMES.SYSTEM;
    } catch {
        return THEMES.SYSTEM;
    }
}

function applyResolvedTheme(theme) {
    const resolvedTheme = resolveTheme(theme);

    document.documentElement.setAttribute("data-theme", resolvedTheme);
    updateThemeButtons(resolvedTheme);
}

function updateThemeButtons(theme) {
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
        const darkModeActive = theme === THEMES.DARK;
        const label = darkModeActive
            ? "Switch to light mode"
            : "Switch to dark mode";

        button.textContent = darkModeActive ? "Light" : "Dark";
        button.setAttribute("aria-label", label);
        button.setAttribute("title", label);
    });
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

function handleThemeToggle(event) {
    if (!event.target.closest("[data-theme-toggle]")) {
        return;
    }

    const resolvedTheme = resolveTheme(currentTheme);

    applyTheme(resolvedTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK);
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

/**
 * Toggles between explicit light and dark themes.
 *
 * @returns {string} The resolved theme that was applied.
 */
export function toggleTheme() {
    const resolvedTheme = resolveTheme(currentTheme);

    return applyTheme(
        resolvedTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK
    );
}

export function initializeTheme() {
    if (initialized) {
        return currentTheme;
    }

    systemThemeQuery = window.matchMedia(SYSTEM_THEME_QUERY);

    if (systemThemeQuery.addEventListener) {
        systemThemeQuery.addEventListener("change", handleSystemThemeChange);
    } else {
        systemThemeQuery.addListener(handleSystemThemeChange);
    }

    document.addEventListener(SETTINGS_CHANGE_EVENT, handleSettingsChange);
    document.addEventListener("click", handleThemeToggle);

    initialized = true;
    applyTheme(getSavedTheme());

    return currentTheme;
}

export function destroy() {
    if (!initialized) {
        return;
    }

    document.removeEventListener(SETTINGS_CHANGE_EVENT, handleSettingsChange);
    document.removeEventListener("click", handleThemeToggle);

    if (systemThemeQuery?.removeEventListener) {
        systemThemeQuery.removeEventListener("change", handleSystemThemeChange);
    } else {
        systemThemeQuery?.removeListener(handleSystemThemeChange);
    }

    systemThemeQuery = null;
    initialized = false;
}
