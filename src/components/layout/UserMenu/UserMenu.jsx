import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { AppIcon } from "../../common/AppIcon.jsx";
import { ROUTES } from "../../../config/routes.js";
import { useAuth } from "../../../hooks/useAuth.js";
import { useToast } from "../../../hooks/useToast.js";
import styles from "./UserMenu.module.css";

const MENU_ITEM_SELECTOR = '[role="menuitem"]';

export function UserMenu() {
    const { logout, profile, user } = useAuth();
    const { showToast } = useToast();
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);
    const triggerRef = useRef(null);
    const displayName = profile?.displayName || user?.displayName || "Student";
    const email = profile?.email || user?.email || "";
    const photoURL = profile?.photoURL || user?.photoURL;
    const initials = displayName
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

    useEffect(() => {
        if (!open) return undefined;

        containerRef.current?.querySelector(MENU_ITEM_SELECTOR)?.focus();

        function handlePointerDown(event) {
            if (!containerRef.current?.contains(event.target)) {
                setOpen(false);
            }
        }

        function handleKeyDown(event) {
            if (event.key === "Escape") {
                event.preventDefault();
                setOpen(false);
                triggerRef.current?.focus();
            }
        }

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open]);

    function handleMenuKeyDown(event) {
        const items = [
            ...event.currentTarget.querySelectorAll(MENU_ITEM_SELECTOR)
        ];
        const index = items.indexOf(document.activeElement);

        if (event.key === "ArrowDown") {
            event.preventDefault();
            items[(index + 1) % items.length]?.focus();
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            items[(index - 1 + items.length) % items.length]?.focus();
        } else if (event.key === "Home") {
            event.preventDefault();
            items[0]?.focus();
        } else if (event.key === "End") {
            event.preventDefault();
            items.at(-1)?.focus();
        } else if (event.key === " ") {
            event.preventDefault();
            document.activeElement?.click();
        }
    }

    async function handleLogout() {
        setOpen(false);

        try {
            await logout();
        } catch {
            showToast({
                type: "error",
                title: "Logout failed",
                message: "Please try again."
            });
        }
    }

    return (
        <div className={styles.container} ref={containerRef}>
            <button
                aria-expanded={open}
                aria-haspopup="menu"
                aria-label={`Open account menu for ${displayName}`}
                className={styles.trigger}
                onClick={() => setOpen((visible) => !visible)}
                ref={triggerRef}
                type="button"
            >
                <span className={styles.avatar}>
                    {photoURL ? (
                        <img alt="" src={photoURL} />
                    ) : (
                        <span aria-hidden="true">{initials}</span>
                    )}
                </span>
                <span className={styles.triggerName}>{displayName}</span>
                <AppIcon name="chevronDown" size={16} />
            </button>
            {open ? (
                <div
                    aria-label="Account menu"
                    className={styles.menu}
                    onKeyDown={handleMenuKeyDown}
                    role="menu"
                >
                    <div className={styles.identity}>
                        <strong>{displayName}</strong>
                        <span>{email}</span>
                    </div>
                    <Link
                        onClick={() => setOpen(false)}
                        role="menuitem"
                        to={ROUTES.SETTINGS}
                    >
                        <AppIcon name="user" size={18} />
                        Profile
                    </Link>
                    <Link
                        onClick={() => setOpen(false)}
                        role="menuitem"
                        to={ROUTES.SETTINGS}
                    >
                        <AppIcon name="settings" size={18} />
                        Settings
                    </Link>
                    <button
                        onClick={handleLogout}
                        role="menuitem"
                        type="button"
                    >
                        <AppIcon name="logout" size={18} />
                        Logout
                    </button>
                </div>
            ) : null}
        </div>
    );
}
