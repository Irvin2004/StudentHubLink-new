import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

import IconButton from "../IconButton/index.js";
import { cx } from "../utils.js";
import styles from "./Modal.module.css";

const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function CloseIcon() {
    return (
        <svg
            aria-hidden="true"
            fill="none"
            height="20"
            viewBox="0 0 24 24"
            width="20"
        >
            <path
                d="M6 6l12 12M18 6 6 18"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2"
            />
        </svg>
    );
}

/**
 * Renders an accessible modal dialog with focus trapping and restoration.
 */
export default function Modal({
    children,
    closeOnOverlay = true,
    description,
    footer,
    initialFocusRef,
    onClose,
    open,
    size = "medium",
    title
}) {
    const dialogRef = useRef(null);
    const titleId = useId();
    const descriptionId = useId();

    useEffect(() => {
        if (!open) return undefined;

        const previousFocus = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        const dialog = dialogRef.current;
        const focusable = [...dialog.querySelectorAll(FOCUSABLE_SELECTOR)];
        (initialFocusRef?.current || focusable[0] || dialog).focus();
        document.body.style.overflow = "hidden";

        function handleKeyDown(event) {
            if (event.key === "Escape") {
                event.preventDefault();
                onClose?.();
                return;
            }

            if (event.key !== "Tab") return;

            const controls = [...dialog.querySelectorAll(FOCUSABLE_SELECTOR)];
            const first = controls[0];
            const last = controls.at(-1);

            if (!first) {
                event.preventDefault();
                dialog.focus();
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
            previousFocus?.focus?.();
        };
    }, [initialFocusRef, onClose, open]);

    if (!open) return null;

    return createPortal(
        <div
            className={styles.overlay}
            onMouseDown={(event) => {
                if (closeOnOverlay && event.target === event.currentTarget) {
                    onClose?.();
                }
            }}
        >
            <section
                aria-describedby={description ? descriptionId : undefined}
                aria-labelledby={titleId}
                aria-modal="true"
                className={cx(styles.dialog, styles[size])}
                ref={dialogRef}
                role="dialog"
                tabIndex={-1}
            >
                <header className={styles.header}>
                    <div>
                        <h2 id={titleId}>{title}</h2>
                        {description ? (
                            <p id={descriptionId}>{description}</p>
                        ) : null}
                    </div>
                    <IconButton aria-label="Close dialog" onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </header>
                <div className={styles.content}>{children}</div>
                {footer ? (
                    <footer className={styles.footer}>{footer}</footer>
                ) : null}
            </section>
        </div>,
        document.body
    );
}
