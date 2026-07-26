import { useState } from "react";

import { useFiles } from "../../../hooks/useFiles.js";
import { useNetwork } from "../../../hooks/useNetwork.js";
import DragDropZone from "../DragDropZone/DragDropZone.jsx";
import UploadProgress from "../UploadProgress/UploadProgress.jsx";
import styles from "./FileUploader.module.css";

export default function FileUploader({ channelId, communityId, onUploaded }) {
    const { isOnline } = useNetwork();
    const { cancelUpload, removeUpload, retryUpload, uploadFiles, uploads } =
        useFiles(channelId, { communityId, subscribe: false });
    const [error, setError] = useState("");

    async function handleFiles(files) {
        if (!isOnline) {
            setError("You're offline. Reconnect before uploading files.");
            return;
        }

        setError("");
        const results = await uploadFiles(files);
        const completed = results
            .filter((result) => result.status === "fulfilled")
            .map((result) => result.value);
        const failure = results.find((result) => result.status === "rejected");

        if (failure)
            setError(
                failure.reason?.message || "Some files could not be uploaded."
            );
        if (completed.length) onUploaded?.(completed);
    }

    return (
        <section
            aria-labelledby="upload-files-title"
            className={styles.uploader}
        >
            <h2 className={styles.srOnly} id="upload-files-title">
                Upload files
            </h2>
            <DragDropZone disabled={!isOnline} onFiles={handleFiles} />
            {uploads.length ? (
                <div className={styles.progress}>
                    {uploads.map((upload) => (
                        <UploadProgress
                            key={upload.id}
                            onCancel={cancelUpload}
                            onRemove={removeUpload}
                            onRetry={retryUpload}
                            upload={upload}
                        />
                    ))}
                </div>
            ) : null}
            {error ? (
                <p className={styles.error} role="alert">
                    {error}
                </p>
            ) : null}
        </section>
    );
}
