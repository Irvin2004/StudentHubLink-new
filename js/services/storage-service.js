import {
    getDownloadURL,
    getStorage,
    ref,
    uploadBytesResumable
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

import { app } from "../firebase.js";

const storage = getStorage(app);

/**
 * Uploads an attachment for a chat conversation.
 *
 * @param {File} file
 * @param {string} conversationId
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
    onProgress = () => {}
) {
    if (!file || !conversationId) {
        return Promise.reject(
            new Error("File and conversation information are required.")
        );
    }

    return new Promise((resolve, reject) => {
        const uniqueId = crypto.randomUUID();
        const storedFileName =
            `${Date.now()}_${uniqueId}_${file.name}`;

        const storageRef = ref(
            storage,
            `messages/${conversationId}/${storedFileName}`
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
