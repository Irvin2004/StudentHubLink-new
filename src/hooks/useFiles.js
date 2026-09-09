import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "./useAuth.js";
import {
    deleteFile as deleteStoredFile,
    downloadFile,
    listenToFiles,
    uploadFile
} from "../services/file-service.js";

export function useFiles(channelId, { communityId, subscribe = true } = {}) {
    const { profile, user } = useAuth();
    const [files, setFiles] = useState([]);
    const [uploads, setUploads] = useState([]);
    const [loadedSubscription, setLoadedSubscription] = useState("");
    const [errorState, setErrorState] = useState({
        key: "",
        value: null
    });
    const activeUploadsRef = useRef(new Map());
    const userId = user?.uid;
    const uploadedByName =
        profile?.displayName || user?.displayName || "Student";
    const shouldSubscribe = Boolean(subscribe && communityId && channelId);
    const subscriptionKey = shouldSubscribe
        ? `${communityId}/${channelId}`
        : "";
    const error = errorState.key === subscriptionKey ? errorState.value : null;
    const loading = Boolean(
        shouldSubscribe && loadedSubscription !== subscriptionKey && !error
    );

    useEffect(() => {
        if (!shouldSubscribe) return undefined;

        return listenToFiles(
            communityId,
            channelId,
            (nextFiles) => {
                setFiles(nextFiles);
                setLoadedSubscription(subscriptionKey);
                setErrorState({ key: subscriptionKey, value: null });
            },
            (nextError) => {
                setLoadedSubscription(subscriptionKey);
                setErrorState({ key: subscriptionKey, value: nextError });
            }
        );
    }, [channelId, communityId, shouldSubscribe, subscriptionKey]);

    useEffect(
        () => () => {
            for (const upload of activeUploadsRef.current.values()) {
                upload.cancel();
            }
            activeUploadsRef.current.clear();
        },
        []
    );

    const startUpload = useCallback(
        (file, existingId) => {
            const localId =
                existingId ||
                `${file.name}-${file.lastModified}-${crypto.randomUUID()}`;
            setUploads((current) => {
                const next = current.filter((item) => item.id !== localId);
                return [
                    ...next,
                    { id: localId, file, progress: 0, status: "uploading" }
                ];
            });

            let handle;
            try {
                handle = uploadFile(file, {
                    communityId,
                    channelId,
                    uploadedBy: userId,
                    uploadedByName,
                    onProgress: (progress, transfer) =>
                        setUploads((current) =>
                            current.map((item) =>
                                item.id === localId
                                    ? { ...item, progress, ...transfer }
                                    : item
                            )
                        )
                });
            } catch (nextError) {
                setUploads((current) =>
                    current.map((item) =>
                        item.id === localId
                            ? {
                                  ...item,
                                  error: nextError.message,
                                  status: "failed"
                              }
                            : item
                    )
                );
                return Promise.reject(nextError);
            }

            activeUploadsRef.current.set(localId, handle);
            return handle.promise
                .then((uploadedFile) => {
                    activeUploadsRef.current.delete(localId);
                    setUploads((current) =>
                        current.map((item) =>
                            item.id === localId
                                ? {
                                      ...item,
                                      fileModel: uploadedFile,
                                      progress: 100,
                                      status: "complete"
                                  }
                                : item
                        )
                    );
                    return uploadedFile;
                })
                .catch((nextError) => {
                    activeUploadsRef.current.delete(localId);
                    setUploads((current) =>
                        current.map((item) =>
                            item.id === localId
                                ? {
                                      ...item,
                                      error: nextError.message,
                                      status:
                                          nextError.code === "file/cancelled"
                                              ? "cancelled"
                                              : "failed"
                                  }
                                : item
                        )
                    );
                    throw nextError;
                });
        },
        [channelId, communityId, uploadedByName, userId]
    );

    const uploadFiles = useCallback(
        (selectedFiles) =>
            Promise.allSettled(
                Array.from(selectedFiles || []).map((file) => startUpload(file))
            ),
        [startUpload]
    );

    const cancelUpload = useCallback((uploadId) => {
        activeUploadsRef.current.get(uploadId)?.cancel();
    }, []);

    const retryUpload = useCallback(
        (uploadId) => {
            const failed = uploads.find((item) => item.id === uploadId);
            if (!failed) return Promise.resolve(null);
            return startUpload(failed.file, uploadId);
        },
        [startUpload, uploads]
    );

    const removeUpload = useCallback((uploadId) => {
        setUploads((current) => current.filter((item) => item.id !== uploadId));
    }, []);

    const deleteFile = useCallback(
        async (file) => {
            await deleteStoredFile(file, userId);
        },
        [userId]
    );

    return {
        cancelUpload,
        deleteFile,
        downloadFile,
        error,
        files,
        loading,
        removeUpload,
        retryUpload,
        uploadFiles,
        uploads
    };
}
