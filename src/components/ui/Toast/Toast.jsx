import IconButton from "../IconButton/index.js";
import { cx } from "../utils.js";
import styles from "./Toast.module.css";

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

function CloseIcon() {
    return (
        <svg
            aria-hidden="true"
            fill="none"
            height="18"
            viewBox="0 0 24 24"
            width="18"
        >
            <path
                d="M7 7l10 10M17 7 7 17"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.8"
            />
        </svg>
    );
}

/**
 * Displays a dismissible live-region notification.
 */
export default function Toast({
    className,
    message,
    onDismiss,
    title,
    type = "info"
}) {
    const urgent = type === "error" || type === "warning";

    return (
        <section
            aria-live={urgent ? "assertive" : "polite"}
            className={cx(styles.toast, styles[type], className)}
            role={urgent ? "alert" : "status"}
        >
            <span className={styles.icon}>
                <StatusIcon type={type} />
            </span>
            <div className={styles.content}>
                {title ? <strong>{title}</strong> : null}
                <p>{message}</p>
            </div>
            {onDismiss ? (
                <IconButton
                    aria-label="Dismiss notification"
                    className={styles.dismiss}
                    onClick={onDismiss}
                    size="small"
                >
                    <CloseIcon />
                </IconButton>
            ) : null}
        </section>
    );
}
