"use strict";

import { THEMES } from "../config/theme-config.js";

const THEME_OPTIONS = Object.freeze([
    { value: THEMES.LIGHT, label: "☀️ Light" },
    { value: THEMES.DARK, label: "🌙 Dark" },
    { value: THEMES.SYSTEM, label: "💻 System" }
]);

function isValidTheme(theme) {
    return Object.values(THEMES).includes(theme);
}

export function createThemeSelector({
    container,
    settingsController,
    currentTheme = THEMES.SYSTEM,
    onError = console.error
} = {}) {
    if (!container?.ownerDocument?.createElement) {
        throw new Error("Theme selector container is required.");
    }

    if (typeof settingsController?.updateSetting !== "function") {
        throw new Error("Theme selector requires a settings controller.");
    }

    const documentReference = container.ownerDocument;
    let selectedTheme = isValidTheme(currentTheme)
        ? currentTheme
        : THEMES.SYSTEM;
    let destroyed = false;

    const label = documentReference.createElement("label");
    label.className = "theme-selector__label";
    label.textContent = "Theme";

    const select = documentReference.createElement("select");
    select.className = "theme-selector__control";
    select.setAttribute("aria-label", "Color theme");

    THEME_OPTIONS.forEach(({ value, label: optionLabel }) => {
        const option = documentReference.createElement("option");
        option.value = value;
        option.textContent = optionLabel;
        select.append(option);
    });

    select.value = selectedTheme;
    label.append(select);
    container.replaceChildren(label);
    container.classList.add("theme-selector");

    function setTheme(theme) {
        if (!isValidTheme(theme)) {
            return false;
        }

        selectedTheme = theme;
        select.value = theme;
        return true;
    }

    function getTheme() {
        return selectedTheme;
    }

    async function handleChange() {
        const nextTheme = select.value;
        const previousTheme = selectedTheme;

        if (!isValidTheme(nextTheme) || nextTheme === previousTheme) {
            select.value = previousTheme;
            return;
        }

        select.disabled = true;

        try {
            const updatedSettings = await settingsController.updateSetting(
                "theme",
                nextTheme
            );

            if (!destroyed) {
                setTheme(updatedSettings?.theme || nextTheme);
            }
        } catch (error) {
            if (!destroyed) {
                setTheme(previousTheme);
                onError(error);
            }
        } finally {
            if (!destroyed) {
                select.disabled = false;
            }
        }
    }

    function handleSettingsChange(event) {
        setTheme(event.detail?.theme);
    }

    function destroy() {
        if (destroyed) {
            return;
        }

        destroyed = true;
        select.removeEventListener("change", handleChange);
        documentReference.removeEventListener(
            "studenthub:settings-changed",
            handleSettingsChange
        );
        container.replaceChildren();
        container.classList.remove("theme-selector");
    }

    select.addEventListener("change", handleChange);
    documentReference.addEventListener(
        "studenthub:settings-changed",
        handleSettingsChange
    );

    return {
        setTheme,
        getTheme,
        destroy
    };
}
