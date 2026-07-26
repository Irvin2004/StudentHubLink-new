import { cx } from "../utils.js";
import styles from "./Divider.module.css";

/**
 * Separates adjacent content visually and semantically.
 */
export default function Divider({
    className,
    label,
    orientation = "horizontal",
    variant = "solid"
}) {
    return (
        <div
            aria-label={label}
            className={cx(
                styles.divider,
                styles[orientation],
                styles[variant],
                label && styles.labelled,
                className
            )}
            role="separator"
            aria-orientation={orientation}
        >
            {label ? <span>{label}</span> : null}
        </div>
    );
}
