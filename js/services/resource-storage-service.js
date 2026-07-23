import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";

import { storage } from "../../src/firebase/storage.js";
import { validateAttachment } from "../utils/file-validator.js?security=1";

export function uploadGroupResource(
    file,
    groupId,
    uploaderId,
    onProgress = () => {}
) {
    if (!(file instanceof File) || !groupId || !uploaderId) {
        return Promise.reject(
            new Error("File and group information are required.")
        );
    }

    validateAttachment(file);

    return new Promise((resolve, reject) => {
        const safeFileName = file.name
            .replace(/[^a-zA-Z0-9._-]/g, "_")
            .toLowerCase();
        const storedFileName = `${Date.now()}-${crypto.randomUUID()}-${safeFileName}`;
        const storagePath = `groups/${groupId}/resources/${uploaderId}/${storedFileName}`;
        const storageReference = ref(storage, storagePath);
        const uploadTask = uploadBytesResumable(storageReference, file, {
            contentType: file.type
        });

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
