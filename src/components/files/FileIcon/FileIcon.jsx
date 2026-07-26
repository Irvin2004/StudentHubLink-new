import { getFileIcon } from "../../../utils/file-icons.js";
import styles from "./FileIcon.module.css";

export default function FileIcon({ extension, size = "medium" }) {
    const icon = getFileIcon(extension);

    return (
        <span
            aria-label={`${icon.label} file`}
            className={styles.icon}
            data-category={icon.category}
            data-size={size}
            role="img"
        >
            <span aria-hidden="true" className={styles.fold} />
            <strong>{icon.label}</strong>
        </span>
    );
}
