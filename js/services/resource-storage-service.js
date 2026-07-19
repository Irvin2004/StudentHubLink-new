import {
    getDownloadURL,
    getStorage,
    ref,
    uploadBytesResumable
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

import { app } from "../firebase.js";

const storage = getStorage(app);

export function uploadGroupResource(
    file,
    groupId,
    onProgress = () => {}
) {
    if (!(file instanceof File) || !groupId) {
        return Promise.reject(
            new Error("File and group information are required.")
        );
    }

    return new Promise((resolve, reject) => {
        const safeFileName = file.name.replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
        );
        const storedFileName =
            `${Date.now()}-${crypto.randomUUID()}-${safeFileName}`;
        const storagePath =
            `groups/${groupId}/resources/${storedFileName}`;
        const storageReference = ref(storage, storagePath);
        const uploadTask = uploadBytesResumable(
            storageReference,
            file,
            { contentType: file.type }
        );

        uploadTask.on(
            "state_changed",
            (snapshot) => {
                const progress = Math.round(
                    (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                );
                onProgress(progress);
            },
            reject,
            async () => {
                try {
                    const downloadURL = await getDownloadURL(
                        uploadTask.snapshot.ref
                    );

                    resolve({
                        storagePath,
                        url: downloadURL,
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