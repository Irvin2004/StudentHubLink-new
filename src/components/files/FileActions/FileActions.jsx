import { canDeleteFile } from "../../../models/file.js";
import styles from "./FileActions.module.css";

export default function FileActions({
    currentUserId,
    file,
    onDelete,
    onDownload,
    onPreview,
    role
}) {
    return (
        <div className={styles.actions}>
            <button onClick={() => onDownload(file)} type="button">
                Download
            </button>
            <button onClick={() => onPreview(file)} type="button">
                Preview
            </button>
            {canDeleteFile(file, currentUserId, role) ? (
                <button
                    className={styles.delete}
                    onClick={() => onDelete(file)}
                    type="button"
                >
                    Delete
                </button>
            ) : null}
        </div>
    );
}
