import { useRef, useState } from "react";

import styles from "./DragDropZone.module.css";

export default function DragDropZone({ disabled = false, onFiles }) {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);

    function choose(files) {
        if (disabled || !files?.length) return;
        onFiles(files);
    }

    return (
        <div
            className={styles.zone}
            data-dragging={dragging || undefined}
            onDragEnter={(event) => {
                event.preventDefault();
                setDragging(true);
            }}
            onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                    setDragging(false);
                }
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                choose(event.dataTransfer.files);
            }}
        >
            <input
                accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt,.csv"
                aria-label="Choose files to upload"
                disabled={disabled}
                multiple
                onChange={(event) => {
                    choose(event.target.files);
                    event.target.value = "";
                }}
                ref={inputRef}
                type="file"
            />
            <span aria-hidden="true" className={styles.uploadIcon}>
                ↑
            </span>
            <div>
                <strong>
                    {dragging ? "Drop files to upload" : "Drop files here"}
                </strong>
                <p>
                    Images, documents, presentations, spreadsheets, ZIP and text
                    files up to 25 MB
                </p>
            </div>
            <button
                disabled={disabled}
                onClick={() => inputRef.current?.click()}
                type="button"
            >
                Choose files
            </button>
        </div>
    );
}
