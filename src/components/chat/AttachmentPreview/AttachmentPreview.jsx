import styles from "./AttachmentPreview.module.css";

export default function AttachmentPreview({ attachments = [], onRemove }) {
    if (!attachments.length) return null;

    return (
        <ul aria-label="Attachments" className={styles.list}>
            {attachments.map((attachment, index) => (
                <li key={attachment.id || attachment.name || index}>
                    <span>{attachment.name || "Attachment"}</span>
                    {onRemove ? (
                        <button
                            aria-label={`Remove ${attachment.name || "attachment"}`}
                            onClick={() => onRemove(index)}
                            type="button"
                        >
                            Remove
                        </button>
                    ) : null}
                </li>
            ))}
        </ul>
    );
}
