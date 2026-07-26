import { forwardRef, useId, useState } from "react";

import IconButton from "../IconButton/index.js";
import Field from "../Field/index.js";
import { cx } from "../utils.js";
import styles from "./Input.module.css";

function EyeIcon({ hidden }) {
    return (
        <svg
            aria-hidden="true"
            fill="none"
            height="18"
            viewBox="0 0 24 24"
            width="18"
        >
            <path
                d={
                    hidden
                        ? "M3 3l18 18M10.6 10.7a2 2 0 002.7 2.7M9.9 4.3A10.7 10.7 0 0112 4c5.5 0 9 5.5 9 8a10.6 10.6 0 01-2.1 3.5M6.6 6.6C4.3 8.1 3 10.5 3 12c0 2.5 3.5 8 9 8 1.3 0 2.5-.3 3.6-.8"
                        : "M3 12c0-2.5 3.5-8 9-8s9 5.5 9 8-3.5 8-9 8-9-5.5-9-8zm9 3a3 3 0 100-6 3 3 0 000 6z"
                }
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
            />
        </svg>
    );
}

/**
 * Renders a labelled text input with optional adornments and validation text.
 */
const Input = forwardRef(function Input(
    {
        className,
        error,
        helperText,
        icon,
        id: providedId,
        label,
        required = false,
        trailingIcon,
        type = "text",
        ...props
    },
    ref
) {
    const generatedId = useId();
    const id = providedId || generatedId;
    const [passwordVisible, setPasswordVisible] = useState(false);
    const password = type === "password";
    const describedBy = error || helperText ? `${id}-message` : undefined;

    return (
        <Field
            error={error}
            helperText={helperText}
            id={id}
            label={label}
            required={required}
        >
            <div
                className={cx(
                    styles.control,
                    error && styles.invalid,
                    className
                )}
            >
                {icon ? (
                    <span aria-hidden="true" className={styles.icon}>
                        {icon}
                    </span>
                ) : null}
                <input
                    {...props}
                    aria-describedby={describedBy}
                    aria-invalid={error ? "true" : undefined}
                    className={styles.input}
                    id={id}
                    ref={ref}
                    required={required}
                    type={password && passwordVisible ? "text" : type}
                />
                {password ? (
                    <IconButton
                        aria-label={
                            passwordVisible ? "Hide password" : "Show password"
                        }
                        className={styles.action}
                        onClick={() =>
                            setPasswordVisible((visible) => !visible)
                        }
                        size="small"
                    >
                        <EyeIcon hidden={passwordVisible} />
                    </IconButton>
                ) : trailingIcon ? (
                    <span className={styles.trailingIcon}>{trailingIcon}</span>
                ) : null}
            </div>
        </Field>
    );
});

export default Input;
