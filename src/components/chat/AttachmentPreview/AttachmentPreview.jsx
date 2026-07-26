import styles from "./AttachmentPreview.module.css";
import { formatFileSize } from "../../../utils/file-size.js";
import { isImageFile } from "../../../utils/file-icons.js";

export default function AttachmentPreview({ attachments = [], onRemove }) {
    if (!attachments.length) return null;

    return (
        <ul aria-label="Attachments" className={styles.list}>
            {attachments.map((attachment, index) => (
                <li key={attachment.id || attachment.name || index}>
                    {isImageFile(attachment) && attachment.url ? (
                        <img alt="" loading="lazy" src={attachment.url} />
                    ) : null}
                    {attachment.url ? (
                        <a
                            href={attachment.url}
                            rel="noreferrer"
                            target="_blank"
                        >
                            {attachment.originalName ||
                                attachment.name ||
                                "Attachment"}
                            <small>{formatFileSize(attachment.size)}</small>
                        </a>
                    ) : (
                        <span>
                            {attachment.originalName ||
                                attachment.name ||
                                "Attachment"}
                        </span>
                    )}
                    {onRemove ? (
                        <button
                            aria-label={`Remove ${attachment.originalName || attachment.name || "attachment"}`}
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
