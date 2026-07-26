import { cx } from "../utils.js";
import styles from "./Skeleton.module.css";

/**
 * Displays a screen-reader-hidden loading placeholder.
 */
export default function Skeleton({
    className,
    count = 1,
    height,
    variant = "text",
    width
}) {
    return (
        <span aria-hidden="true" className={cx(styles.group, className)}>
            {Array.from({ length: count }, (_, index) => (
                <span
                    className={cx(styles.skeleton, styles[variant])}
                    key={index}
                    style={{ height, width }}
                />
            ))}
        </span>
    );
}
