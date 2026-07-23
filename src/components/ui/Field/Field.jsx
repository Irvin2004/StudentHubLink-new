import styles from "./Field.module.css";
import { cx } from "../utils.js";

export default function Field({
    children,
    className,
    error,
    helperText,
    id,
    label,
    required
}) {
    const message = error || helperText;

    return (
        <div className={cx(styles.field, className)}>
            {label ? (
                <label className={styles.label} htmlFor={id}>
                    {label}
                    {required ? (
                        <span aria-hidden="true" className={styles.required}>
                            *
                        </span>
                    ) : null}
                </label>
            ) : null}
            {children}
            {message ? (
                <small
                    className={cx(styles.message, error && styles.error)}
                    id={`${id}-message`}
                >
                    {message}
                </small>
            ) : null}
        </div>
    );
}
