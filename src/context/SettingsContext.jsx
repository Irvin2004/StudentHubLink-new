import { useCallback, useEffect, useMemo, useState } from "react";

import { SETTINGS_DEFAULTS } from "../../js/config/settings-defaults.js";
import { SettingsContext } from "./settings-context.js";

const STORAGE_KEY = "studenthub:settings:v1";

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState(() => {
        try {
            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
            return {
                ...SETTINGS_DEFAULTS,
                ...stored,
                notifications: {
                    ...SETTINGS_DEFAULTS.notifications,
                    ...stored?.notifications
                }
            };
        } catch {
            return {
                ...SETTINGS_DEFAULTS,
                notifications: { ...SETTINGS_DEFAULTS.notifications }
            };
        }
    });

    const updateSettings = useCallback((updates) => {
        setSettings((current) => ({ ...current, ...updates }));
    }, []);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }, [settings]);

    const value = useMemo(
        () => ({ settings, updateSettings }),
        [settings, updateSettings]
    );

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
}
