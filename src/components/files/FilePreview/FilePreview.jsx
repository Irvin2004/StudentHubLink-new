import Modal from "../../ui/Modal/index.js";
import { formatFileSize } from "../../../utils/file-size.js";
import { isImageFile, isPdfFile } from "../../../utils/file-icons.js";
import FileIcon from "../FileIcon/FileIcon.jsx";
import styles from "./FilePreview.module.css";

export default function FilePreview({ file, onClose, onDownload }) {
    if (!file) return null;

    return (
        <Modal
            description={`${formatFileSize(file.size)} · Uploaded by ${file.uploadedByName}`}
            onClose={onClose}
            open
            size="large"
            title={file.originalName}
            footer={
                <div className={styles.footer}>
                    {isPdfFile(file) ? (
                        <a
                            className={styles.action}
                            href={file.url}
                            rel="noreferrer"
                            target="_blank"
                        >
                            Open PDF in new tab
                        </a>
                    ) : null}
                    <button
                        className={`${styles.action} ${styles.primary}`}
                        onClick={() => onDownload(file)}
                        type="button"
                    >
                        Download
                    </button>
                </div>
            }
        >
            <div className={styles.preview}>
                {isImageFile(file) ? (
                    <img
                        alt={`Preview of ${file.originalName}`}
                        src={file.url}
                    />
                ) : (
                    <div className={styles.fallback}>
                        <FileIcon extension={file.extension} />
                        <strong>{file.originalName}</strong>
                        <p>
                            {isPdfFile(file)
                                ? "PDF previews open safely in a new browser tab."
                                : "Preview is not available for this file type. Download it to open it."}
                        </p>
                    </div>
                )}
            </div>
        </Modal>
    );
}
