import { Link, NavLink } from "react-router-dom";

import { AppIcon } from "../../common/AppIcon.jsx";
import { ROUTES } from "../../../config/routes.js";
import styles from "./Sidebar.module.css";

const NAVIGATION_ITEMS = Object.freeze([
    { icon: "home", label: "Home", to: ROUTES.DASHBOARD, end: true },
    { icon: "users", label: "Communities", to: ROUTES.COMMUNITIES },
    { icon: "messages", label: "Messages", to: ROUTES.CHAT },
    { icon: "files", label: "Files", to: ROUTES.FILES },
    {
        icon: "bell",
        label: "Notifications",
        to: ROUTES.NOTIFICATIONS
    },
    { icon: "settings", label: "Settings", to: ROUTES.SETTINGS }
]);

function handleNavigationKeyDown(event) {
    const link = event.target.closest("a");

    if (!link) return;

    const links = [...event.currentTarget.querySelectorAll("a")];
    const index = links.indexOf(link);
    const previousKeys = ["ArrowUp", "ArrowLeft"];
    const nextKeys = ["ArrowDown", "ArrowRight"];

    if (previousKeys.includes(event.key)) {
        event.preventDefault();
        links[(index - 1 + links.length) % links.length]?.focus();
    } else if (nextKeys.includes(event.key)) {
        event.preventDefault();
        links[(index + 1) % links.length]?.focus();
    } else if (event.key === "Home") {
        event.preventDefault();
        links[0]?.focus();
    } else if (event.key === "End") {
        event.preventDefault();
        links.at(-1)?.focus();
    } else if (event.key === " ") {
        event.preventDefault();
        link.click();
    }
}

export function Sidebar({ onNavigate = () => {} }) {
    return (
        <div className={styles.sidebar}>
            <Link
                aria-label="StudentHub application home"
                className={styles.brand}
                onClick={onNavigate}
                to={ROUTES.DASHBOARD}
            >
                <span className={styles.brandMark} aria-hidden="true">
                    S
                </span>
                <span className={styles.brandName}>StudentHub</span>
            </Link>
            <nav
                aria-label="Application navigation"
                className={styles.navigation}
                onKeyDown={handleNavigationKeyDown}
            >
                {NAVIGATION_ITEMS.map((item) => (
                    <NavLink
                        className={({ isActive }) =>
                            `${styles.navigationLink} ${
                                isActive ? styles.active : ""
                            }`
                        }
                        end={item.end}
                        key={item.to}
                        onClick={onNavigate}
                        title={item.label}
                        to={item.to}
                    >
                        <AppIcon
                            className={styles.navigationIcon}
                            name={item.icon}
                            size={22}
                        />
                        <span className={styles.navigationLabel}>
                            {item.label}
                        </span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
