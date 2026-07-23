import { forwardRef, useId } from "react";

import { cx } from "../utils.js";
import styles from "./Checkbox.module.css";

/**
 * Renders a labelled native checkbox with helper and error text.
 */
const Checkbox = forwardRef(function Checkbox(
    { className, error, helperText, id: providedId, label, ...props },
    ref
) {
    const generatedId = useId();
    const id = providedId || generatedId;
    const description = error || helperText;

    return (
        <div className={cx(styles.wrapper, className)}>
            <label className={styles.label} htmlFor={id}>
                <input
                    {...props}
                    aria-describedby={description ? `${id}-message` : undefined}
                    aria-invalid={error ? "true" : undefined}
                    className={styles.input}
                    id={id}
                    ref={ref}
                    type="checkbox"
                />
                <span aria-hidden="true" className={styles.control}>
                    <svg fill="none" viewBox="0 0 16 16">
                        <path
                            d="m3 8 3 3 7-7"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                        />
                    </svg>
                </span>
                <span>{label}</span>
            </label>
            {description ? (
                <small
                    className={cx(styles.message, error && styles.error)}
                    id={`${id}-message`}
                >
                    {description}
                </small>
            ) : null}
        </div>
    );
});

export default Checkbox;
