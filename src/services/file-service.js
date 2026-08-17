import {
    collection,
    collectionGroup,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    getCountFromServer,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    startAfter,
    where
} from "firebase/firestore";
import {
    deleteObject,
    getDownloadURL,
    ref,
    uploadBytesResumable
} from "firebase/storage";

import { auth, db, storage } from "../firebase/index.js";
import { ACTIVITY_TYPES } from "../config/activity-types.js";
import { RECENT_RESOURCE_LIMIT } from "../config/resource-library.js";
import { createFileModel } from "../models/file.js";
import { createActivity } from "./activity-service.js";
import { createNotification } from "./notification-service.js";
import {
    sanitizeStorageFileName,
    validateFile
} from "../utils/file-validation.js";
import { getActionableErrorMessage } from "../utils/app-error-mapper.js";

const COMMUNITIES = "communities";
const CHANNELS = "channels";
const FILES = "files";
const FILE_LIMIT = 60;
const LIBRARY_COMMUNITY_LIMIT = 50;
const LIBRARY_CHANNEL_LIMIT = 50;
const FAVORITES_LIMIT = 500;
const RESOURCE_ACTIVITY_LIMIT = 500;
const RESOURCE_PAGE_SIZE = 12;
const RESOURCE_COMMUNITY_BATCH_SIZE = 30;
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

    const storageMessages = {
        "storage/invalid-checksum":
            "The upload integrity check failed. Please retry the file.",
        "storage/quota-exceeded":
            "File storage is currently full. Contact an administrator before retrying.",
        "storage/retry-limit-exceeded":
            "The upload took too long. Check your connection and retry.",
        "storage/unauthenticated": "Sign in again before uploading files.",
        "storage/unauthorized":
            "You do not have permission to upload files here."
    };
    if (storageMessages[error?.code]) {
        const storageError = new Error(storageMessages[error.code]);
        storageError.code = error.code;
        return storageError;
    }

    const normalized = new Error(getActionableErrorMessage(error, "files"));
    normalized.code = error?.code || "file/unknown";
    return normalized;
}

async function announceFile(file) {
    const snapshot = await getDocs(
        collection(db, COMMUNITIES, file.communityId, "members")
    );
    if (!snapshot?.docs) return;
    await Promise.allSettled(
        snapshot.docs
            .filter((item) => item.id !== file.uploadedBy)
            .map((item) =>
                createNotification(item.id, {
                    senderId: file.uploadedBy,
                    senderName: file.uploadedByName,
                    type: "new_file",
                    title: `New file in #${file.channelId}`,
                    message: file.originalName,
                    communityId: file.communityId,
                    channelId: file.channelId,
                    referenceId: file.id,
                    route: `/community/${file.communityId}/channel/${file.channelId}`
                })
            )
    );
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
    const storedName = `${Date.now()}-${sanitizeStorageFileName(validated.name)}`;
    const storagePath = `${COMMUNITIES}/${cleanCommunityId}/${CHANNELS}/${cleanChannelId}/${FILES}/${metadataReference.id}/${storedName}`;
    const storageReference = ref(storage, storagePath);
    const task = uploadBytesResumable(storageReference, file, {
        contentType: validated.type,
        customMetadata: {
            channelId: cleanChannelId,
            communityId: cleanCommunityId,
            fileId: metadataReference.id,
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
                onProgress(progress, {
                    bytesTransferred: snapshot.bytesTransferred,
                    state: snapshot.state || "running",
                    totalBytes: snapshot.totalBytes
                });
            },
            (error) => reject(normalizeFileError(error)),
            async () => {
                try {
                    const url = await getDownloadURL(task.snapshot.ref);
                    const data = {
                        name: storedName,
                        filename: validated.originalName,
                        normalizedFilename:
                            validated.originalName.toLowerCase(),
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
                        messageId: messageId ? String(messageId) : null,
                        tags: []
                    };

                    await setDoc(metadataReference, data);
                    const model = createFileModel({
                        id: metadataReference.id,
                        ...data
                    });
                    void createActivity(cleanCommunityId, {
                        type: ACTIVITY_TYPES.FILE_UPLOADED,
                        actorId: cleanUserId,
                        actorName: data.uploadedByName,
                        title: `${data.uploadedByName} shared a file`,
                        description: data.originalName,
                        channelId: cleanChannelId,
                        referenceId: metadataReference.id
                    }).catch(() => {});
                    void announceFile(model);
                    resolve(model);
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
    const page = await getFilesPage(communityId, channelId, null, FILE_LIMIT);
    return page.files;
}

export async function getFilesPage(
    communityId,
    channelId,
    cursor = null,
    pageSize = RESOURCE_PAGE_SIZE
) {
    const constraints = [orderBy("uploadedAt", "desc")];
    if (cursor) constraints.push(startAfter(cursor));
    constraints.push(limit(pageSize));
    const filesQuery = query(
        filesReference(communityId, channelId),
        ...constraints
    );
    const snapshot = await getDocs(filesQuery);

    return {
        cursor: snapshot.docs.at(-1) || cursor,
        files: snapshot.docs.map((item) =>
            fromSnapshot(item, communityId, channelId)
        ),
        hasMore: snapshot.size === pageSize
    };
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

function toResourceLibraryItem(file, communityName, channelName) {
    const title =
        file.originalName.replace(/\.[^.]+$/, "") || file.originalName;

    return {
        ...file,
        title,
        communityName: communityName || "Community",
        channelName: channelName || file.channelId,
        resourceKey: [file.communityId, file.channelId, file.id].join(":")
    };
}

async function getMembershipCommunityIds(userId) {
    const membershipQuery = query(
        collectionGroup(db, "members"),
        where("userId", "==", requireUserId(userId)),
        limit(LIBRARY_COMMUNITY_LIMIT)
    );
    const snapshot = await getDocs(membershipQuery);

    return snapshot.docs
        .map((membership) => membership.ref?.parent?.parent?.id)
        .filter(Boolean);
}

async function getCommunityLibraryData(communityId) {
    const [communitySnapshot, channelsSnapshot] = await Promise.all([
        getDoc(doc(db, COMMUNITIES, communityId)),
        getDocs(
            query(
                collection(db, COMMUNITIES, communityId, CHANNELS),
                orderBy("position", "asc"),
                limit(LIBRARY_CHANNEL_LIMIT)
            )
        )
    ]);
    const communityName = communitySnapshot.exists()
        ? communitySnapshot.data().name
        : "Community";
    const destinations = channelsSnapshot.docs.map((channelSnapshot) => ({
        channelId: channelSnapshot.id,
        channelName: channelSnapshot.data().name || "Channel",
        communityId,
        communityName
    }));
    return { destinations };
}

function chunkValues(values, size) {
    const chunks = [];
    for (let index = 0; index < values.length; index += size) {
        chunks.push(values.slice(index, index + size));
    }
    return chunks;
}

async function getResourcePages(communityIds, destinations, cursors = {}) {
    const communityNames = new Map(
        destinations.map((destination) => [
            destination.communityId,
            destination.communityName
        ])
    );
    const channelNames = new Map(
        destinations.map((destination) => [
            `${destination.communityId}/${destination.channelId}`,
            destination.channelName
        ])
    );
    const batches = chunkValues(
        [...new Set(communityIds)].sort(),
        RESOURCE_COMMUNITY_BATCH_SIZE
    );
    const pages = await Promise.all(
        batches.map(async (communityBatch) => {
            const key = communityBatch.join("|");
            const constraints = [
                where("communityId", "in", communityBatch),
                orderBy("uploadedAt", "desc")
            ];
            if (cursors[key]) constraints.push(startAfter(cursors[key]));
            constraints.push(limit(RESOURCE_PAGE_SIZE));
            const snapshot = await getDocs(
                query(collectionGroup(db, FILES), ...constraints)
            );
            const files = snapshot.docs.map((item) => {
                const data = item.data();
                return fromSnapshot(item, data.communityId, data.channelId);
            });

            return {
                cursor: snapshot.docs.at(-1) || cursors[key] || null,
                hasMore: snapshot.size === RESOURCE_PAGE_SIZE,
                key,
                resources: files.map((file) =>
                    toResourceLibraryItem(
                        file,
                        communityNames.get(file.communityId),
                        channelNames.get(
                            `${file.communityId}/${file.channelId}`
                        )
                    )
                )
            };
        })
    );

    return {
        cursors: Object.fromEntries(
            pages.map((page) => [page.key, page.hasMore ? page.cursor : null])
        ),
        hasMore: pages.some((page) => page.hasMore),
        resources: pages.flatMap((page) => page.resources)
    };
}

async function getResourceLibraryBase(userId) {
    const communityIds = await getMembershipCommunityIds(userId);
    const communityData = await Promise.all(
        communityIds.map(getCommunityLibraryData)
    );
    const destinations = communityData.flatMap((item) => item.destinations);
    const page = await getResourcePages(communityIds, destinations);

    return {
        communityIds,
        destinations,
        ...page
    };
}

export async function getResourceLibrary(userId) {
    const library = await getResourceLibraryBase(userId);
    return library.resources;
}

async function getResourceFavoriteRecords(userId) {
    const favoritesQuery = query(
        collection(db, "favorites"),
        where("userId", "==", requireUserId(userId)),
        limit(FAVORITES_LIMIT)
    );
    const snapshot = await getDocs(favoritesQuery);

    return snapshot.docs
        .map((favoriteDocument) => ({
            createdAt: favoriteDocument.data().createdAt || null,
            id: favoriteDocument.id,
            resourceKey: String(
                favoriteDocument.data().resourceKey ||
                    favoriteDocument.data().resourceId ||
                    ""
            )
        }))
        .filter((favorite) => favorite.resourceKey);
}

export async function getResourceFavorites(userId) {
    const favoriteRecords = await getResourceFavoriteRecords(userId);

    return favoriteRecords.reduce((favorites, favorite) => {
        favorites[favorite.resourceKey] = favorite.id;
        return favorites;
    }, {});
}

async function getResourceActivity(userId) {
    const activityReference = collection(
        db,
        "users",
        requireUserId(userId),
        "resourceActivity"
    );
    const snapshot = await getDocs(
        query(
            activityReference,
            orderBy("lastOpened", "desc"),
            limit(RECENT_RESOURCE_LIMIT)
        )
    );

    return snapshot.docs.reduce((activity, activityDocument) => {
        const data = activityDocument.data();
        const resourceKey = String(data.resourceId || "");
        if (resourceKey) activity[resourceKey] = data.lastOpened || null;
        return activity;
    }, {});
}

export async function getResourceLibraryData(userId) {
    const [library, favoriteRecords, activity] = await Promise.all([
        getResourceLibraryBase(userId),
        getResourceFavoriteRecords(userId),
        getResourceActivity(userId)
    ]);
    const favorites = favoriteRecords.reduce((result, favorite) => {
        result[favorite.resourceKey] = favorite.id;
        return result;
    }, {});
    const favoriteDates = favoriteRecords.reduce((result, favorite) => {
        result[favorite.resourceKey] = favorite.createdAt;
        return result;
    }, {});
    const totalCount = (
        await Promise.all(
            chunkValues(
                [...new Set(library.communityIds)].sort(),
                RESOURCE_COMMUNITY_BATCH_SIZE
            ).map(async (communityBatch) => {
                const count = await getCountFromServer(
                    query(
                        collectionGroup(db, FILES),
                        where("communityId", "in", communityBatch)
                    )
                );
                return Number(count.data().count || 0);
            })
        )
    ).reduce((total, count) => total + count, 0);

    return {
        ...library,
        favorites,
        totalCount,
        resources: library.resources.map((resource) => ({
            ...resource,
            favoriteAt: favoriteDates[resource.resourceKey] || null,
            lastOpened: activity[resource.resourceKey] || null
        }))
    };
}

export async function getMoreResourceLibraryData(destinations, cursors = {}) {
    const communityIds = destinations
        .map((destination) => destination.communityId)
        .filter(Boolean);
    const activeIds = chunkValues(
        [...new Set(communityIds)].sort(),
        RESOURCE_COMMUNITY_BATCH_SIZE
    )
        .filter((batch) => cursors[batch.join("|")])
        .flat();

    return getResourcePages(activeIds, destinations, cursors);
}

export async function recordResourceOpened(userId, resourceKey) {
    const cleanUserId = requireUserId(userId);
    const cleanResourceKey = String(resourceKey || "").trim();
    if (!cleanResourceKey) throw new TypeError("A resource key is required.");

    const timestamp = serverTimestamp();
    const activityReference = collection(
        db,
        "users",
        cleanUserId,
        "resourceActivity"
    );
    await setDoc(
        doc(activityReference, cleanResourceKey),
        {
            lastOpened: timestamp,
            resourceId: cleanResourceKey,
            updatedAt: timestamp,
            userId: cleanUserId
        },
        { merge: true }
    );

    const recentSnapshot = await getDocs(
        query(
            activityReference,
            orderBy("lastOpened", "desc"),
            limit(RESOURCE_ACTIVITY_LIMIT)
        )
    );
    await Promise.all(
        recentSnapshot.docs
            .slice(RECENT_RESOURCE_LIMIT)
            .map((activityDocument) => deleteDoc(activityDocument.ref))
    );

    return timestamp;
}

export async function setResourceFavorite(
    userId,
    resourceKey,
    favoriteDocumentId = null
) {
    const cleanUserId = requireUserId(userId);
    const cleanResourceKey = String(resourceKey || "").trim();
    if (!cleanResourceKey) throw new TypeError("A resource key is required.");

    if (favoriteDocumentId) {
        await deleteDoc(doc(db, "favorites", favoriteDocumentId));
        return null;
    }

    const reference = doc(collection(db, "favorites"));
    await setDoc(reference, {
        userId: cleanUserId,
        resourceId: cleanResourceKey,
        resourceKey: cleanResourceKey,
        createdAt: serverTimestamp()
    });

    return reference.id;
}
