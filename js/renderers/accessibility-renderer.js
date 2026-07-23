"use strict";

const FONT_SIZES = new Set(["small", "medium", "large"]);
const SETTINGS_CHANGE_EVENT = "studenthub:settings-changed";

let activeDocument = null;
let settingsChangeHandler = null;

export function applyAccessibilitySettings(
    settings = {},
    documentReference = activeDocument || globalThis.document
) {
    const root = documentReference?.documentElement;

    if (!root?.setAttribute) {
        throw new Error("Accessibility document is unavailable.");
    }

    const fontSize = FONT_SIZES.has(settings.fontSize)
        ? settings.fontSize
        : "medium";
    const highContrast = settings.highContrast === true;
    const reducedMotion = settings.reducedMotion === true;

    root.setAttribute("data-font-size", fontSize);
    root.setAttribute(
        "data-reduced-motion",
        String(reducedMotion)
    );

    if (highContrast) {
        root.setAttribute("data-contrast", "high");
    } else {
        root.removeAttribute("data-contrast");
    }

    return {
        fontSize,
        highContrast,
        reducedMotion
    };
}

export function initializeAccessibilityRenderer({
    documentReference = globalThis.document,
    initialSettings = {}
} = {}) {
    destroyAccessibilityRenderer();

    if (!documentReference?.addEventListener) {
        throw new Error("Accessibility document is unavailable.");
    }

    activeDocument = documentReference;
    settingsChangeHandler = (event) => {
        applyAccessibilitySettings(
            event.detail || {},
            activeDocument
        );
    };

    activeDocument.addEventListener(
        SETTINGS_CHANGE_EVENT,
        settingsChangeHandler
    );
    applyAccessibilitySettings(initialSettings, activeDocument);

    return {
        apply(settings) {
            return applyAccessibilitySettings(
                settings,
                activeDocument
            );
        },
        destroy: destroyAccessibilityRenderer
    };
}

export function destroyAccessibilityRenderer() {
    if (activeDocument && settingsChangeHandler) {
        activeDocument.removeEventListener(
            SETTINGS_CHANGE_EVENT,
            settingsChangeHandler
        );
    }

    activeDocument = null;
    settingsChangeHandler = null;
}
