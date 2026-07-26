import styles from "./Spinner.module.css";
import { cx } from "../utils.js";

/**
 * Displays an accessible indeterminate loading indicator.
 */
export default function Spinner({
    className,
    decorative = false,
    label = "Loading",
    size = "medium"
}) {
    return (
        <span
            aria-hidden={decorative || undefined}
            aria-label={decorative ? undefined : label}
            className={cx(styles.spinner, styles[size], className)}
            role={decorative ? undefined : "status"}
        >
            {decorative ? null : (
                <span className="visually-hidden">{label}</span>
            )}
        </span>
    );
}
