import styles from "./MessageStatus.module.css";

export default function MessageStatus({ pending = false }) {
    return pending ? (
        <span className={styles.status} role="status">
            Sending…
        </span>
    ) : null;
}
