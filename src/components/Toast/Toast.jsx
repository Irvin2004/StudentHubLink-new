import styles from "./Toast.module.css";

const TYPE_LABELS = Object.freeze({
    error: "Error",
    info: "Information",
    success: "Success",
    warning: "Warning"
});

function StatusIcon({ type }) {
    const path =
        type === "success"
            ? "M5 12l4 4L19 6"
            : type === "warning"
              ? "M12 8v5m0 3h.01"
              : type === "error"
                ? "M8 8l8 8m0-8-8 8"
                : "M12 11v5m0-8h.01";

    return (
        <svg
            aria-hidden="true"
            fill="none"
            height="20"
            viewBox="0 0 24 24"
            width="20"
        >
            <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="1.8"
            />
            <path
                d={path}
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
            />
        </svg>
    );
}

export default function Toast({
    dismissing = false,
    message,
    onDismiss,
    title,
    type = "info"
}) {
    const urgent = type === "error" || type === "warning";
    const className = [
        styles.toast,
        styles[type],
        dismissing ? styles.dismissing : ""
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <section
            aria-atomic="true"
            aria-live={urgent ? "assertive" : "polite"}
            className={className}
            data-dismissing={dismissing || undefined}
            data-type={type}
            role={urgent ? "alert" : "status"}
        >
            <span aria-hidden="true" className={styles.icon}>
                <StatusIcon type={type} />
            </span>
            <span className="sr-only">{TYPE_LABELS[type]} notification:</span>
            <div className={styles.content}>
                {title ? <strong>{title}</strong> : null}
                <p>{message}</p>
            </div>
            <button
                aria-label={`Dismiss ${TYPE_LABELS[type].toLowerCase()} notification`}
                className={styles.dismiss}
                onClick={onDismiss}
                type="button"
            >
                <span aria-hidden="true">×</span>
            </button>
        </section>
    );
}
