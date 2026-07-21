import {
    getDownloadURL,
    getStorage,
    ref,
    uploadBytesResumable
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

import { app } from "../firebase.js";
import { validateAttachment } from "../utils/file-validator.js?security=1";

const storage = getStorage(app);

/**
 * Uploads an attachment for a chat conversation.
 *
 * @param {File} file
 * @param {string} conversationId
 * @param {string} senderId
 * @param {(progress: number) => void} onProgress
 * @returns {Promise<{
 *   url: string,
 *   fileName: string,
 *   fileSize: number,
 *   mimeType: string
 * }>}
 */
export function uploadChatAttachment(
    file,
    conversationId,
    senderId,
    onProgress = () => {}
) {
    if (!file || !conversationId || !senderId) {
        return Promise.reject(
            new Error("File and conversation information are required.")
        );
    }

    validateAttachment(file);

    return new Promise((resolve, reject) => {
        const uniqueId = crypto.randomUUID();
        const safeFileName = file.name
            .replace(/[^a-zA-Z0-9._-]/g, "_")
            .toLowerCase();
        const storedFileName =
            `${Date.now()}_${uniqueId}_${safeFileName}`;

        const storageRef = ref(
            storage,
            `messages/${conversationId}/${senderId}/${storedFileName}`
        );

        const uploadTask = uploadBytesResumable(
            storageRef,
            file,
            { contentType: file.type }
        );

        uploadTask.on(
            "state_changed",
            (snapshot) => {
                const progress = Math.round(
                    (snapshot.bytesTransferred /
                        snapshot.totalBytes) * 100
                );

                onProgress(progress);
            },
            reject,
            async () => {
                try {
                    const url = await getDownloadURL(
                        uploadTask.snapshot.ref
                    );

                    resolve({
                        url,
                        fileName: file.name,
                        fileSize: file.size,
                        mimeType: file.type
                    });
                } catch (error) {
                    reject(error);
                }
            }
        );
    });
}
