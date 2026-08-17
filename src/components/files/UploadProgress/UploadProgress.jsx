import { formatFileSize } from "../../../utils/file-size.js";
import FileIcon from "../FileIcon/FileIcon.jsx";
import styles from "./UploadProgress.module.css";

export default function UploadProgress({
    onCancel,
    onRemove,
    onRetry,
    upload
}) {
    const failed = upload.status === "failed";
    const cancelled = upload.status === "cancelled";
    const complete = upload.status === "complete";
    const extension = upload.file?.name?.split(".").pop();
    const transferLabel = upload.totalBytes
        ? `${formatFileSize(upload.bytesTransferred)} of ${formatFileSize(upload.totalBytes)}`
        : "Preparing upload";

    return (
        <div className={styles.item} data-status={upload.status}>
            <FileIcon extension={extension} size="small" />
            <div className={styles.details}>
                <div className={styles.heading}>
                    <strong>{upload.file?.name}</strong>
                    <span>
                        {complete ? "Ready" : `${upload.progress || 0}%`}
                    </span>
                </div>
                <div
                    aria-label={`${upload.file?.name} upload progress`}
                    aria-valuemax="100"
                    aria-valuemin="0"
                    aria-valuenow={upload.progress || 0}
                    className={styles.track}
                    role="progressbar"
                >
                    <span style={{ width: `${upload.progress || 0}%` }} />
                </div>
                <p aria-live="polite">
                    {failed || cancelled
                        ? upload.error || "Upload cancelled."
                        : complete
                          ? `${formatFileSize(upload.file?.size)} uploaded`
                          : `${transferLabel} uploaded`}
                </p>
            </div>
            <div className={styles.actions}>
                {upload.status === "uploading" ? (
                    <button onClick={() => onCancel(upload.id)} type="button">
                        Cancel
                    </button>
                ) : null}
                {failed || cancelled ? (
                    <button
                        onClick={() => {
                            void Promise.resolve(onRetry(upload.id)).catch(
                                () => {}
                            );
                        }}
                        type="button"
                    >
                        Retry
                    </button>
                ) : null}
                {upload.status !== "uploading" ? (
                    <button onClick={() => onRemove(upload.id)} type="button">
                        Remove
                    </button>
                ) : null}
            </div>
        </div>
    );
}
