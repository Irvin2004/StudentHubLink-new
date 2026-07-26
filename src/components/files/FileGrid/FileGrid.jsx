import FileCard from "../FileCard/FileCard.jsx";
import styles from "./FileGrid.module.css";

export default function FileGrid({ files, ...props }) {
    return (
        <div className={styles.grid}>
            {files.map((file) => (
                <FileCard file={file} key={file.id} {...props} />
            ))}
        </div>
    );
}
