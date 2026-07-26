import { forwardRef } from "react";

import Spinner from "../Spinner/index.js";
import { cx } from "../utils.js";
import styles from "./Button.module.css";

/**
 * Renders a theme-aware action button with semantic variants and loading state.
 */
const Button = forwardRef(function Button(
    {
        children,
        className,
        disabled = false,
        icon,
        loading = false,
        loadingLabel = "Loading",
        size = "medium",
        type = "button",
        variant = "primary",
        ...props
    },
    ref
) {
    const unavailable = disabled || loading;

    return (
        <button
            {...props}
            aria-busy={loading || undefined}
            className={cx(
                styles.button,
                styles[variant],
                styles[size],
                className
            )}
            disabled={unavailable}
            ref={ref}
            type={type}
        >
            {loading ? <Spinner decorative size="small" /> : icon}
            <span>{loading ? loadingLabel : children}</span>
        </button>
    );
});

export default Button;
