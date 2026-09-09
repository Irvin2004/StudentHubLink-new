import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { AppIcon } from "../../common/AppIcon.jsx";
import { MEDIA_QUERIES } from "../../../config/breakpoints.js";
import styles from "./MobileDrawer.module.css";

const FOCUSABLE_SELECTOR = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])'
].join(",");
export function MobileDrawer({ children, onClose, open, returnFocusRef }) {
    const drawerRef = useRef(null);
    const previouslyOpenRef = useRef(false);
    const [mobile, setMobile] = useState(
        () => window.matchMedia(MEDIA_QUERIES.MOBILE).matches
    );

    useEffect(() => {
        const query = window.matchMedia(MEDIA_QUERIES.MOBILE);
        const handleChange = (event) => setMobile(event.matches);

        query.addEventListener("change", handleChange);
        return () => query.removeEventListener("change", handleChange);
    }, []);

    useLayoutEffect(() => {
        if (mobile && previouslyOpenRef.current && !open) {
            returnFocusRef.current?.focus();
        }

        previouslyOpenRef.current = open;
    }, [mobile, open, returnFocusRef]);

    useLayoutEffect(() => {
        if (!mobile || !open) return undefined;

        const drawer = drawerRef.current;
        const returnFocusElement = returnFocusRef.current;
        const previousOverflow = document.body.style.overflow;
        const focusCloseButton = () => {
            drawer?.querySelector("button")?.focus();
        };

        document.body.style.overflow = "hidden";
        focusCloseButton();

        function handleKeyDown(event) {
            if (event.key === "Escape") {
                event.preventDefault();
                onClose();
                return;
            }

            if (event.key !== "Tab" || !drawer) return;

            const focusable = [...drawer.querySelectorAll(FOCUSABLE_SELECTOR)];

            if (!focusable.length) return;

            const first = focusable[0];
            const last = focusable.at(-1);

            if (!drawer.contains(document.activeElement)) {
                event.preventDefault();
                (event.shiftKey ? last : first).focus();
            } else if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = previousOverflow;
            returnFocusElement?.focus();
        };
    }, [mobile, onClose, open, returnFocusRef]);

    const accessible = !mobile || open;

    return (
        <>
            <div
                aria-hidden="true"
                className={`${styles.backdrop} ${
                    open ? styles.backdropOpen : ""
                }`}
                onMouseDown={onClose}
            />
            <aside
                aria-hidden={!accessible}
                aria-label="Primary navigation"
                className={`${styles.drawer} ${open ? styles.open : ""}`}
                inert={!accessible}
                ref={drawerRef}
            >
                <button
                    aria-label="Close navigation"
                    className={styles.closeButton}
                    onClick={onClose}
                    type="button"
                >
                    <AppIcon name="close" size={22} />
                </button>
                {children}
            </aside>
        </>
    );
}
