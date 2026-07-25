import { AppIcon } from "../../common/AppIcon.jsx";
import styles from "./ReplyPreview.module.css";

export default function ReplyPreview({ reply, onClose, compact = false }) {
    if (!reply) return null;

    return (
        <div className={compact ? styles.compact : styles.preview}>
            <span aria-hidden="true" className={styles.rule} />
            <div className={styles.content}>
                <strong>
                    {compact
                        ? reply.senderName
                        : `Replying to ${reply.senderName}`}
                </strong>
                <p>{reply.text || "Message"}</p>
            </div>
            {onClose ? (
                <button
                    aria-label="Cancel reply"
                    className={styles.close}
                    onClick={onClose}
                    type="button"
                >
                    <AppIcon name="close" size={18} />
                </button>
            ) : null}
        </div>
    );
}
