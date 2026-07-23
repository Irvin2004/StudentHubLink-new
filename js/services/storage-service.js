import {
    deleteObject,
    getDownloadURL,
    getStorage,
    ref,
    uploadBytesResumable
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

import { app } from "../firebase.js";
import { validateAttachment } from "../utils/file-validator.js?security=1";
import { logError } from "./error-service.js";

const storage = getStorage(app);
const MAX_VOICE_MESSAGE_SIZE = 25 * 1024 * 1024;

function validateStorageId(value, fieldName) {
    const normalized = typeof value === "string" ? value.trim() : "";

    if (!normalized) {
        throw new Error(`${fieldName} is required.`);
    }

    if (normalized.includes("/")) {
        throw new Error(`${fieldName} is invalid.`);
    }

    return normalized;
}

function getVoiceExtension(mimeType) {
    return mimeType.includes("ogg") ? "ogg" : "webm";
}

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

/**
 * Uploads recorded audio without writing message data to Firestore.
 *
 * @param {string} conversationId
 * @param {string} userId
 * @param {Blob} blob
 * @param {(progress: number) => void} onProgress
 * @returns {Promise<{
 *   downloadURL: string,
 *   storagePath: string,
 *   size: number
 * }>}
 */
export async function uploadVoiceMessage(
    conversationId,
    userId,
    blob,
    onProgress = () => {}
) {
    let cleanConversationId;
    let cleanUserId;

    try {
        cleanConversationId = validateStorageId(
            conversationId,
            "Conversation ID"
        );
        cleanUserId = validateStorageId(userId, "User ID");
    } catch (error) {
        return Promise.reject(error);
    }

    if (!(blob instanceof Blob) || blob.size <= 0) {
        return Promise.reject(new Error("A recorded audio blob is required."));
    }

    if (blob.size > MAX_VOICE_MESSAGE_SIZE) {
        return Promise.reject(
            new Error("Voice message must be 25 MB or smaller.")
        );
    }

    if (!/^audio\/(webm|ogg)(;.*)?$/i.test(blob.type)) {
        return Promise.reject(
            new Error("Voice message must use WebM or Ogg audio.")
        );
    }

    const extension = getVoiceExtension(blob.type.toLowerCase());
    const fileName = `${Date.now()}_${crypto.randomUUID()}.${extension}`;
    const storagePath =
        `voice/${cleanConversationId}/${cleanUserId}/${fileName}`;
    const voiceReference = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(
        voiceReference,
        blob,
        { contentType: blob.type }
    );
    const reportProgress = typeof onProgress === "function"
        ? onProgress
        : () => {};

    return new Promise((resolve, reject) => {
        uploadTask.on(
            "state_changed",
            (snapshot) => {
                const progress = snapshot.totalBytes > 0
                    ? Math.round(
                        (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                    )
                    : 0;
                reportProgress(progress);
            },
            reject,
            async () => {
                try {
                    const downloadURL = await getDownloadURL(
                        uploadTask.snapshot.ref
                    );

                    resolve({
                        downloadURL,
                        storagePath,
                        size: blob.size
                    });
                } catch (error) {
                    try {
                        await deleteObject(uploadTask.snapshot.ref);
                    } catch (cleanupError) {
                        logError(
                            cleanupError,
                            "Voice upload cleanup failed"
                        );
                    }

                    reject(error);
                }
            }
        );
    });
}

export async function deleteVoiceMessage(storagePath) {
    const cleanStoragePath = typeof storagePath === "string"
        ? storagePath.trim()
        : "";

    if (!cleanStoragePath) {
        throw new Error("Voice message storage path is required.");
    }

    if (!/^voice\/[^/]+\/[^/]+\/[^/]+\.(webm|ogg)$/.test(
        cleanStoragePath
    )) {
        throw new Error("Invalid voice message storage path.");
    }

    await deleteObject(ref(storage, cleanStoragePath));
}
