import { forwardRef, useId } from "react";

import Field from "../Field/index.js";
import { cx } from "../utils.js";
import styles from "./Select.module.css";

/**
 * Renders a labelled native select with consistent design-system styling.
 */
const Select = forwardRef(function Select(
    {
        children,
        className,
        error,
        helperText,
        id: providedId,
        label,
        required = false,
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
            <select
                {...props}
                aria-describedby={
                    error || helperText ? `${id}-message` : undefined
                }
                aria-invalid={error ? "true" : undefined}
                className={cx(
                    styles.select,
                    error && styles.invalid,
                    className
                )}
                id={id}
                ref={ref}
                required={required}
            >
                {children}
            </select>
        </Field>
    );
});

export default Select;
