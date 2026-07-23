export function FormField({
    autoComplete,
    helpText,
    id,
    label,
    ...inputProps
}) {
    const helpId = helpText ? `${id}-help` : undefined;

    return (
        <div className="form-group">
            <label htmlFor={id}>{label}</label>
            <input
                {...inputProps}
                aria-describedby={helpId}
                autoComplete={autoComplete}
                id={id}
                name={id}
            />
            {helpText ? (
                <small className="form-help" id={helpId}>
                    {helpText}
                </small>
            ) : null}
        </div>
    );
}
