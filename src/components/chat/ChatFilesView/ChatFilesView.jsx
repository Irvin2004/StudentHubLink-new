import { useEffect } from "react";

import FileList from "../../files/FileList/FileList.jsx";
import FileUploader from "../../files/FileUploader/FileUploader.jsx";
import { useAuth } from "../../../hooks/useAuth.js";
import { useFiles } from "../../../hooks/useFiles.js";
import { useObservability } from "../../../hooks/useObservability.js";
import { useToast } from "../../../hooks/useToast.js";
import styles from "./ChatFilesView.module.css";

export default function ChatFilesView({ channelId, communityId, role }) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const { captureError, getActionableErrorMessage } = useObservability();
    const { deleteFile, downloadFile, error, files, loading } = useFiles(
        channelId,
        { communityId }
    );

    useEffect(() => {
        if (!error) return;
        captureError(error, { feature: "channel_files" });
        showToast({
            title: "Files unavailable",
            message: getActionableErrorMessage(error, "files"),
            type: "error"
        });
    }, [captureError, error, getActionableErrorMessage, showToast]);

    async function handleDelete(file) {
        if (
            !window.confirm(
                `Delete ${file.originalName}? This cannot be undone.`
            )
        ) {
            return;
        }

        try {
            await deleteFile(file);
            showToast({
                title: "File deleted",
                message: `${file.originalName} was removed.`,
                type: "success"
            });
        } catch (nextError) {
            captureError(nextError, { feature: "delete_file" });
            showToast({
                title: "Could not delete file",
                message: getActionableErrorMessage(nextError, "files"),
                type: "error"
            });
        }
    }

    return (
        <div className={styles.files}>
            <FileUploader channelId={channelId} communityId={communityId} />
            <FileList
                currentUserId={user?.uid}
                error={error}
                files={files}
                loading={loading}
                onDelete={handleDelete}
                onDownload={downloadFile}
                role={role}
            />
        </div>
    );
}
