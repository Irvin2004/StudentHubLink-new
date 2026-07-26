import styles from "./MessageStatus.module.css";

const STATUS_CONTENT = {
    sending: ["Sending…", "clock"],
    sent: ["Sent", "sent"],
    failed: ["Failed", "failed"]
};

export default function MessageStatus({ status = "sent", onRetry }) {
    const [label, icon] = STATUS_CONTENT[status] || STATUS_CONTENT.sent;

    if (status === "sent") {
        return (
            <span aria-label={label} className={styles.sent} title={label}>
                ✓
            </span>
        );
    }

    return (
        <span className={styles.wrapper} role="status">
            <span className={styles[icon]}>
                {status === "sending" ? "◷" : "⚠"} {label}
            </span>
            {status === "failed" && onRetry ? (
                <button onClick={onRetry} type="button">
                    Retry
                </button>
            ) : null}
        </span>
    );
}
