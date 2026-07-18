import {
    deleteObject,
    getDownloadURL,
    getStorage,
    ref,
    uploadBytes
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

import { app } from "../firebase.js";
import { validateMessageFile } from "../utils/validators.js";

const storage = getStorage(app);

function getMessageFolder(file) {
    if (file.type.startsWith("image/")) return "images";
    if (file.type.startsWith("audio/")) return "voice";
    return "files";
}

function createSafeFileName(fileName) {
    return fileName
        .normalize("NFKD")
        .replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function uploadMessageFile(conversationId, file) {
    if (!conversationId) {
        throw new Error("Conversation is missing.");
    }

    validateMessageFile(file);

    const folder = getMessageFolder(file);
    const storagePath = [
        "messages",
        conversationId,
        folder,
        `${Date.now()}_${createSafeFileName(file.name)}`
    ].join("/");
    const fileReference = ref(storage, storagePath);
    const snapshot = await uploadBytes(fileReference, file, {
        contentType: file.type
    });

    return {
        fileUrl: await getDownloadURL(snapshot.ref),
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        storagePath
    };
}

export async function deleteStoredFile(storagePath) {
    if (!storagePath) return;

    await deleteObject(ref(storage, storagePath));
}
