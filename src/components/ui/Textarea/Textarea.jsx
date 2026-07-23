import { forwardRef, useId } from "react";

import Field from "../Field/index.js";
import { cx } from "../utils.js";
import styles from "./Textarea.module.css";

/**
 * Renders an accessible multiline text field.
 */
const Textarea = forwardRef(function Textarea(
    {
        className,
        error,
        helperText,
        id: providedId,
        label,
        required = false,
        rows = 4,
        ...props
    },
    ref
) {
    const generatedId = useId();
    const id = providedId || generatedId;

    return (
        <Field
            error={error}
            helperText={helperText}
            id={id}
            label={label}
            required={required}
        >
            <textarea
                {...props}
                aria-describedby={
                    error || helperText ? `${id}-message` : undefined
                }
                aria-invalid={error ? "true" : undefined}
                className={cx(
                    styles.textarea,
                    error && styles.invalid,
                    className
                )}
                id={id}
                ref={ref}
                required={required}
                rows={rows}
            />
        </Field>
    );
});

export default Textarea;
