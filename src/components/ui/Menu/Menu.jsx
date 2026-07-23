import { forwardRef } from "react";

import { cx } from "../utils.js";
import styles from "./Menu.module.css";

/**
 * Renders an accessible action menu with roving arrow-key focus.
 */
const Menu = forwardRef(function Menu(
    { className, items = [], onSelect, ...props },
    ref
) {
    function handleKeyDown(event) {
        const controls = [
            ...event.currentTarget.querySelectorAll(
                '[role="menuitem"]:not(:disabled)'
            )
        ];
        const index = controls.indexOf(document.activeElement);

        if (event.key === "ArrowDown") {
            event.preventDefault();
            controls[(index + 1) % controls.length]?.focus();
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            controls[(index - 1 + controls.length) % controls.length]?.focus();
        } else if (event.key === "Home") {
            event.preventDefault();
            controls[0]?.focus();
        } else if (event.key === "End") {
            event.preventDefault();
            controls.at(-1)?.focus();
        }
    }

    return (
        <div
            {...props}
            className={cx(styles.menu, className)}
            onKeyDown={handleKeyDown}
            ref={ref}
            role="menu"
        >
            {items.map((item) =>
                item.separator ? (
                    <div
                        className={styles.separator}
                        key={item.id}
                        role="separator"
                    />
                ) : (
                    <button
                        className={cx(
                            styles.item,
                            item.danger && styles.danger
                        )}
                        disabled={item.disabled}
                        key={item.id}
                        onClick={() => onSelect?.(item.id)}
                        role="menuitem"
                        type="button"
                    >
                        {item.icon ? (
                            <span aria-hidden="true" className={styles.icon}>
                                {item.icon}
                            </span>
                        ) : null}
                        <span>{item.label}</span>
                    </button>
                )
            )}
        </div>
    );
});

export default Menu;
