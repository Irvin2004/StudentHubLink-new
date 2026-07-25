import { Link } from "react-router-dom";

import { AppIcon } from "../../common/AppIcon.jsx";
import { ROUTES } from "../../../config/routes.js";
import { useSettings } from "../../../hooks/useSettings.js";
import { useTheme } from "../../../hooks/useTheme.js";
import { useNotifications } from "../../../hooks/useNotifications.js";
import { UserMenu } from "../UserMenu/UserMenu.jsx";
import styles from "./Topbar.module.css";

const THEME_ORDER = Object.freeze(["system", "light", "dark"]);
const THEME_ICONS = Object.freeze({
    dark: "moon",
    light: "sun",
    system: "system"
});

export function Topbar({ menuButtonRef, onMenuToggle }) {
    const { updateSettings } = useSettings();
    const { unreadCount } = useNotifications();
    const { setTheme, theme } = useTheme();
    const nextTheme =
        THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length];

    function cycleTheme() {
        setTheme(nextTheme);
        updateSettings({ theme: nextTheme });
    }

    return (
        <header className={styles.topbar}>
            <div className={styles.mobileBrand}>
                <button
                    aria-label="Open navigation"
                    className={styles.iconButton}
                    onClick={onMenuToggle}
                    ref={menuButtonRef}
                    type="button"
                >
                    <AppIcon name="menu" size={22} />
                </button>
                <Link to={ROUTES.DASHBOARD}>StudentHub</Link>
            </div>
            <div className={styles.search} role="search">
                <AppIcon name="search" size={20} />
                <label className="sr-only" htmlFor="app-search">
                    Search StudentHub
                </label>
                <input
                    autoComplete="off"
                    id="app-search"
                    placeholder="Search StudentHub"
                    type="search"
                />
                <kbd aria-hidden="true">/</kbd>
            </div>
            <div className={styles.actions}>
                <Link
                    aria-label={`View notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
                    className={styles.iconButton}
                    to={ROUTES.NOTIFICATIONS}
                >
                    <AppIcon name="bell" size={21} />
                    {unreadCount ? (
                        <span className={styles.notificationBadge}>
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                    ) : null}
                </Link>
                <button
                    aria-label={`Theme: ${theme}. Switch to ${nextTheme}.`}
                    className={styles.themeButton}
                    onClick={cycleTheme}
                    title={`Switch to ${nextTheme} theme`}
                    type="button"
                >
                    <AppIcon name={THEME_ICONS[theme]} size={19} />
                    <span>{theme}</span>
                </button>
                <UserMenu />
            </div>
        </header>
    );
}
