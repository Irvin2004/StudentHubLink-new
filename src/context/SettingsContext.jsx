import { useCallback, useMemo, useState } from "react";

import { SETTINGS_DEFAULTS } from "../../js/config/settings-defaults.js";
import { SettingsContext } from "./settings-context.js";

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState(() => ({
        ...SETTINGS_DEFAULTS,
        notifications: { ...SETTINGS_DEFAULTS.notifications }
    }));

    const updateSettings = useCallback((updates) => {
        setSettings((current) => ({ ...current, ...updates }));
    }, []);

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
