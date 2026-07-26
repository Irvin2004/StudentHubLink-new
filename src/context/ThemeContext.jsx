import { useCallback, useMemo, useState } from "react";

import {
    applyTheme,
    getCurrentTheme
} from "../../js/services/theme-service.js";
import { ThemeContext } from "./theme-context.js";

export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState(getCurrentTheme);

    const setTheme = useCallback((nextTheme) => {
        applyTheme(nextTheme);
        setThemeState(nextTheme);
    }, []);

    const value = useMemo(() => ({ setTheme, theme }), [setTheme, theme]);

    return (
        <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
    );
}
