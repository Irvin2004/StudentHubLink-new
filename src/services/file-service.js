import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc
} from "firebase/firestore";
import {
    deleteObject,
    getDownloadURL,
    ref,
    uploadBytesResumable
} from "firebase/storage";

import { auth, db, storage } from "../firebase/index.js";
import { createFileModel } from "../models/file.js";
import {
    sanitizeStorageFileName,
    validateFile
} from "../utils/file-validation.js";

const COMMUNITIES = "communities";
const CHANNELS = "channels";
const FILES = "files";
const FILE_LIMIT = 60;
const metadataCache = new Map();

function requireId(value, label) {
    const id = String(value ?? "").trim();
    if (!id) throw new TypeError(`${label} is required.`);
    if (id.includes("/")) throw new TypeError(`${label} is invalid.`);
    return id;
}

function requireUserId(value) {
    return requireId(value || auth.currentUser?.uid, "A user ID");
}

function filesReference(communityId, channelId) {
    return collection(
        db,
        COMMUNITIES,
        requireId(communityId, "A community ID"),
        CHANNELS,
        requireId(channelId, "A channel ID"),
        FILES
    );
}

function fileReference(communityId, channelId, fileId) {
    return doc(
        filesReference(communityId, channelId),
        requireId(fileId, "A file ID")
    );
}

function fromSnapshot(snapshot, communityId, channelId) {
    const model = createFileModel({
        id: snapshot.id,
        communityId,
        channelId,
        ...snapshot.data()
    });
    metadataCache.set(`${communityId}/${channelId}/${model.id}`, model);
    return model;
}

function normalizeFileError(error) {
    if (error?.code === "storage/canceled") {
        const canceled = new Error("Upload cancelled.");
        canceled.code = "file/cancelled";
        return canceled;
    }

    const normalized = new Error(
        error?.message || "The file operation failed."
    );
    normalized.code = error?.code || "file/unknown";
    return normalized;
}

export function uploadFile(
    file,
    {
        communityId,
        channelId,
        messageId = null,
        onProgress = () => {},
        uploadedBy,
        uploadedByName = "Student"
    } = {}
) {
    const validated = validateFile(file);
    const cleanCommunityId = requireId(communityId, "A community ID");
    const cleanChannelId = requireId(channelId, "A channel ID");
    const cleanUserId = requireUserId(uploadedBy);
    const metadataReference = doc(
        filesReference(cleanCommunityId, cleanChannelId)
    );
    const storedName = `${Date.now()}-${metadataReference.id}-${sanitizeStorageFileName(validated.name)}`;
    const storagePath = `${COMMUNITIES}/${cleanCommunityId}/${CHANNELS}/${cleanChannelId}/${FILES}/${storedName}`;
    const storageReference = ref(storage, storagePath);
    const task = uploadBytesResumable(storageReference, file, {
        contentType: validated.type,
        customMetadata: {
            channelId: cleanChannelId,
            communityId: cleanCommunityId,
            uploadedBy: cleanUserId
        }
    });

    const promise = new Promise((resolve, reject) => {
        task.on(
            "state_changed",
            (snapshot) => {
                const progress =
                    snapshot.totalBytes > 0
                        ? Math.round(
                              (snapshot.bytesTransferred /
                                  snapshot.totalBytes) *
                                  100
                          )
                        : 0;
                onProgress(progress);
            },
            (error) => reject(normalizeFileError(error)),
            async () => {
                try {
                    const url = await getDownloadURL(task.snapshot.ref);
                    const data = {
                        name: storedName,
                        originalName: validated.originalName,
                        extension: validated.extension,
                        size: validated.size,
                        type: validated.type,
                        url,
                        storagePath,
                        uploadedBy: cleanUserId,
                        uploadedByName:
                            String(uploadedByName || "Student").trim() ||
                            "Student",
                        uploadedAt: serverTimestamp(),
                        communityId: cleanCommunityId,
                        channelId: cleanChannelId,
                        messageId: messageId ? String(messageId) : null
                    };

                    await setDoc(metadataReference, data);
                    resolve(
                        createFileModel({
                            id: metadataReference.id,
                            ...data
                        })
                    );
                } catch (error) {
                    try {
                        await deleteObject(storageReference);
                    } catch {
                        // Best-effort cleanup; preserve the original failure.
                    }
                    reject(normalizeFileError(error));
                }
            }
        );
    });

    return {
        cancel: () => task.cancel(),
        id: metadataReference.id,
        promise
    };
}

export async function deleteFile(file, userId) {
    requireUserId(userId);
    const model = createFileModel(file);

    await deleteObject(ref(storage, model.storagePath));
    await deleteDoc(
        fileReference(model.communityId, model.channelId, model.id)
    );
    metadataCache.delete(`${model.communityId}/${model.channelId}/${model.id}`);
}

export function downloadFile(file) {
    const model = createFileModel(file);
    if (!model.url) throw new Error("This file does not have a download URL.");

    const link = document.createElement("a");
    link.href = model.url;
    link.download = model.originalName;
    link.rel = "noopener";
    document.body.append(link);
    link.click();
    link.remove();
}

export async function getFiles(communityId, channelId) {
    const filesQuery = query(
        filesReference(communityId, channelId),
        orderBy("uploadedAt", "desc"),
        limit(FILE_LIMIT)
    );
    const snapshot = await getDocs(filesQuery);
    return snapshot.docs.map((item) =>
        fromSnapshot(item, communityId, channelId)
    );
}

export function listenToFiles(communityId, channelId, onData, onError) {
    const filesQuery = query(
        filesReference(communityId, channelId),
        orderBy("uploadedAt", "desc"),
        limit(FILE_LIMIT)
    );

    return onSnapshot(
        filesQuery,
        (snapshot) =>
            onData(
                snapshot.docs.map((item) =>
                    fromSnapshot(item, communityId, channelId)
                )
            ),
        onError
    );
}

export async function getFileMetadata(communityId, channelId, fileId) {
    const cacheKey = `${communityId}/${channelId}/${fileId}`;
    if (metadataCache.has(cacheKey)) return metadataCache.get(cacheKey);

    const snapshot = await getDoc(
        fileReference(communityId, channelId, fileId)
    );
    if (!snapshot.exists()) return null;
    return fromSnapshot(snapshot, communityId, channelId);
}
