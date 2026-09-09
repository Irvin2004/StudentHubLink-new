import Modal from "../../ui/Modal/index.js";
import { formatFileSize } from "../../../utils/file-size.js";
import {
    isImageFile,
    isPdfFile,
    isPreviewableFile
} from "../../../utils/file-icons.js";
import FileIcon from "../FileIcon/FileIcon.jsx";
import styles from "./FilePreview.module.css";

export default function FilePreview({
    file,
    onClose,
    onDownload,
    onStudyWithThuto
}) {
    if (!file) return null;
    const previewable = isPreviewableFile(file);

    return (
        <Modal
            description={`${formatFileSize(file.size)} · Uploaded by ${file.uploadedByName}`}
            onClose={onClose}
            open
            size="wide"
            title={file.originalName}
            footer={
                <div className={styles.footer}>
                    {onStudyWithThuto ? (
                        <button
                            className={styles.action}
                            onClick={() => onStudyWithThuto(file)}
                            type="button"
                        >
                            Study with Thuto
                        </button>
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
                ) : isPdfFile(file) ? (
                    <iframe
                        src={`${file.url}#toolbar=0&navpanes=0`}
                        title={`Preview of ${file.originalName}`}
                    />
                ) : (
                    <div className={styles.fallback}>
                        <FileIcon extension={file.extension} />
                        <strong>{file.originalName}</strong>
                        <p>
                            {previewable
                                ? "Preview unavailable. Download the file to open it."
                                : "This file type does not support an in-app preview. Download it to open it."}
                        </p>
                    </div>
                )}
            </div>
        </Modal>
    );
}
