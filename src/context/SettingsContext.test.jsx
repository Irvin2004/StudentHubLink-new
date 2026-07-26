import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useSettings } from "../hooks/useSettings.js";
import { SettingsProvider } from "./SettingsContext";

function SettingsHarness() {
    const { settings, updateSettings } = useSettings();

    return (
        <>
            <output>{settings.fontSize}</output>
            <button
                type="button"
                onClick={() => updateSettings({ fontSize: "large" })}
            >
                Large text
            </button>
            <button
                type="button"
                onClick={() => updateSettings({ highContrast: true })}
            >
                High contrast
            </button>
            <button
                type="button"
                onClick={() => updateSettings({ reducedMotion: true })}
            >
                Reduce motion
            </button>
        </>
    );
}

describe("SettingsProvider", () => {
    beforeEach(() => {
        const values = new Map();
        vi.stubGlobal("localStorage", {
            clear: () => values.clear(),
            getItem: (key) => values.get(key) ?? null,
            setItem: (key, value) => values.set(key, String(value))
        });
    });

    afterEach(() => {
        localStorage.clear();
        vi.unstubAllGlobals();
        delete document.documentElement.dataset.fontSize;
        delete document.documentElement.dataset.contrast;
        delete document.documentElement.dataset.reducedMotion;
    });

    it("applies accessibility preferences to the document", () => {
        render(
            <SettingsProvider>
                <SettingsHarness />
            </SettingsProvider>
        );

        fireEvent.click(screen.getByRole("button", { name: "Large text" }));
        fireEvent.click(screen.getByRole("button", { name: "High contrast" }));
        fireEvent.click(screen.getByRole("button", { name: "Reduce motion" }));

        expect(document.documentElement.dataset.fontSize).toBe("large");
        expect(document.documentElement.dataset.contrast).toBe("high");
        expect(document.documentElement.dataset.reducedMotion).toBe("true");
    });
});
