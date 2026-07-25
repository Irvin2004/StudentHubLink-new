import FileActions from "../FileActions/FileActions.jsx";
import FileIcon from "../FileIcon/FileIcon.jsx";
import { formatFileSize } from "../../../utils/file-size.js";
import { isImageFile } from "../../../utils/file-icons.js";
import styles from "./FileCard.module.css";

function formatUploadedAt(value) {
    const date =
        typeof value?.toDate === "function"
            ? value.toDate()
            : value instanceof Date
              ? value
              : new Date(value || Date.now());
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium"
    }).format(date);
}

export default function FileCard(props) {
    const { file } = props;

    return (
        <article className={styles.card}>
            <div className={styles.preview}>
                {isImageFile(file) ? (
                    <img alt="" loading="lazy" src={file.url} />
                ) : (
                    <FileIcon extension={file.extension} />
                )}
            </div>
            <div className={styles.body}>
                <h3 title={file.originalName}>{file.originalName}</h3>
                <p>
                    {formatFileSize(file.size)} · {file.extension.toUpperCase()}
                </p>
                <p>Uploaded by {file.uploadedByName}</p>
                <time>{formatUploadedAt(file.uploadedAt)}</time>
            </div>
            <FileActions {...props} />
        </article>
    );
}
