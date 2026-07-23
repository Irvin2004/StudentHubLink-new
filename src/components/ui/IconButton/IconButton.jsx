import { forwardRef } from "react";

import { cx } from "../utils.js";
import styles from "./IconButton.module.css";

/**
 * Renders a square icon-only button with a required accessible label.
 */
const IconButton = forwardRef(function IconButton(
    {
        "aria-label": ariaLabel,
        children,
        className,
        size = "medium",
        variant = "ghost",
        type = "button",
        ...props
    },
    ref
) {
    if (!ariaLabel) {
        throw new Error("IconButton requires an aria-label.");
    }

    return (
        <button
            {...props}
            aria-label={ariaLabel}
            className={cx(
                styles.button,
                styles[size],
                styles[variant],
                className
            )}
            ref={ref}
            type={type}
        >
            {children}
        </button>
    );
});

export default IconButton;
