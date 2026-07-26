import { cx } from "../utils.js";
import styles from "./Badge.module.css";

/**
 * Displays compact semantic metadata.
 */
export default function Badge({ children, className, variant = "neutral" }) {
    return (
        <span className={cx(styles.badge, styles[variant], className)}>
            {children}
        </span>
    );
}
