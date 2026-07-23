import { forwardRef, useId } from "react";

import { cx } from "../utils.js";
import styles from "./Switch.module.css";

/**
 * Renders an accessible boolean switch backed by a native checkbox.
 */
const Switch = forwardRef(function Switch(
    { className, description, id: providedId, label, ...props },
    ref
) {
    const generatedId = useId();
    const id = providedId || generatedId;
    const labelId = `${id}-label`;

    return (
        <div className={cx(styles.wrapper, className)}>
            <label className={styles.label} htmlFor={id}>
                <strong id={labelId}>{label}</strong>
                <span className={styles.switch}>
                    <input
                        {...props}
                        aria-describedby={
                            description ? `${id}-description` : undefined
                        }
                        aria-labelledby={labelId}
                        className={styles.input}
                        id={id}
                        ref={ref}
                        role="switch"
                        type="checkbox"
                    />
                    <span aria-hidden="true" className={styles.track}>
                        <span className={styles.thumb} />
                    </span>
                </span>
            </label>
            {description ? (
                <small className={styles.description} id={`${id}-description`}>
                    {description}
                </small>
            ) : null}
        </div>
    );
});

export default Switch;
