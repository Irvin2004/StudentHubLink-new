import { cloneElement, useEffect, useId, useRef, useState } from "react";

import { cx } from "../utils.js";
import styles from "./Dropdown.module.css";

const FOCUSABLE_SELECTOR =
    'button:not([disabled]), a[href], [role="menuitem"]:not([aria-disabled="true"]), [tabindex]:not([tabindex="-1"])';

/**
 * Anchors dismissible popover content to a trigger.
 */
export default function Dropdown({
    align = "end",
    children,
    className,
    trigger
}) {
    const [open, setOpen] = useState(false);
    const id = useId();
    const panelRef = useRef(null);
    const rootRef = useRef(null);
    const triggerRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;

        panelRef.current?.querySelector(FOCUSABLE_SELECTOR)?.focus();

        function handlePointerDown(event) {
            if (!rootRef.current?.contains(event.target)) {
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
    }, [id, open]);

    return (
        <div className={cx(styles.dropdown, className)} ref={rootRef}>
            {cloneElement(trigger, {
                "aria-controls": id,
                "aria-expanded": open,
                "aria-haspopup": "menu",
                onClick: (event) => {
                    trigger.props.onClick?.(event);
                    setOpen((current) => !current);
                },
                ref: triggerRef
            })}
            {open ? (
                <div
                    className={cx(styles.panel, styles[align])}
                    id={id}
                    ref={panelRef}
                    onClick={(event) => {
                        if (event.target.closest('[role="menuitem"]')) {
                            setOpen(false);
                            triggerRef.current?.focus();
                        }
                    }}
                >
                    {children}
                </div>
            ) : null}
        </div>
    );
}
