import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    createActivity: vi.fn(),
    deleteDoc: vi.fn(),
    deleteObject: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    getCountFromServer: vi.fn(),
    getDownloadURL: vi.fn(),
    setDoc: vi.fn(),
    timestamp: { _methodName: "serverTimestamp" },
    task: null,
    uploadBytesResumable: vi.fn()
}));

vi.mock("firebase/firestore", () => ({
    collection: (...segments) => ({
        path: segments.map((segment) => segment.path || segment).join("/")
    }),
    collectionGroup: (_db, name) => ({ path: name }),
    deleteDoc: mocks.deleteDoc,
    doc: (...segments) =>
        segments.length === 1
            ? { id: "file-1", path: `${segments[0].path}/file-1` }
            : {
                  id: segments.at(-1),
                  path: segments
                      .map((segment) => segment.path || segment)
                      .join("/")
              },
    getDoc: mocks.getDoc,
    getDocs: mocks.getDocs,
    getCountFromServer: mocks.getCountFromServer,
    limit: vi.fn(),
    onSnapshot: vi.fn(),
    orderBy: vi.fn(),
    query: vi.fn(),
    serverTimestamp: () => mocks.timestamp,
    setDoc: mocks.setDoc,
    startAfter: vi.fn(),
    where: vi.fn()
}));

vi.mock("firebase/storage", () => ({
    deleteObject: mocks.deleteObject,
    getDownloadURL: mocks.getDownloadURL,
    ref: (_storage, path) => ({ path }),
    uploadBytesResumable: mocks.uploadBytesResumable
}));

vi.mock("../firebase/index.js", () => ({
    auth: { currentUser: { uid: "user-1" } },
    db: { path: "db" },
    storage: { path: "storage" }
}));

vi.mock("./activity-service.js", () => ({
    createActivity: mocks.createActivity
}));

import {
    downloadFile,
    getResourceFavorites,
    getResourceLibrary,
    getResourceLibraryData,
    recordResourceOpened,
    setResourceFavorite,
    uploadFile
} from "./file-service.js";

describe("file service", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.getDownloadURL.mockResolvedValue(
            "https://files.test/assignment.pdf"
        );
        mocks.setDoc.mockResolvedValue();
        mocks.deleteObject.mockResolvedValue();
        mocks.createActivity.mockResolvedValue("activity-1");
        mocks.getDoc.mockReset();
        mocks.getDocs.mockReset();
        mocks.getCountFromServer.mockResolvedValue({
            data: () => ({ count: 1 })
        });
        mocks.getDocs.mockResolvedValue({ docs: [] });
        mocks.task = {
            snapshot: { ref: { path: "stored-file" } },
            cancel: vi.fn(),
            on: vi.fn((_event, progress, _error, complete) => {
                progress({ bytesTransferred: 68, totalBytes: 100 });
                queueMicrotask(complete);
            })
        };
        mocks.uploadBytesResumable.mockImplementation(() => mocks.task);
    });

    test("uploads bytes, reports progress and creates metadata", async () => {
        const onProgress = vi.fn();
        const handle = uploadFile(
            new File(["assignment"], "Assignment.pdf", {
                type: "application/pdf"
            }),
            {
                channelId: "general",
                communityId: "community-1",
                onProgress,
                uploadedBy: "user-1",
                uploadedByName: "Alex"
            }
        );
        const uploaded = await handle.promise;

        expect(onProgress).toHaveBeenCalledWith(68, {
            bytesTransferred: 68,
            state: "running",
            totalBytes: 100
        });
        expect(mocks.uploadBytesResumable).toHaveBeenCalledWith(
            expect.objectContaining({
                path: expect.stringMatching(
                    /^communities\/community-1\/channels\/general\/files\/file-1\//
                )
            }),
            expect.any(File),
            expect.objectContaining({
                customMetadata: {
                    channelId: "general",
                    communityId: "community-1",
                    fileId: "file-1",
                    uploadedBy: "user-1"
                }
            })
        );
        expect(mocks.setDoc).toHaveBeenCalledWith(
            expect.objectContaining({ id: "file-1" }),
            expect.objectContaining({
                originalName: "Assignment.pdf",
                storagePath: expect.stringMatching(
                    /^communities\/community-1\/channels\/general\/files\/file-1\//
                ),
                uploadedBy: "user-1",
                url: "https://files.test/assignment.pdf"
            })
        );
        expect(uploaded.id).toBe("file-1");
        expect(mocks.createActivity).toHaveBeenCalledWith(
            "community-1",
            expect.objectContaining({
                type: "file_uploaded",
                referenceId: "file-1"
            })
        );
    });

    test("normalizes upload cancellation", async () => {
        mocks.task = {
            snapshot: { ref: {} },
            cancel: vi.fn(),
            on: vi.fn((_event, _progress, error) => {
                queueMicrotask(() => error({ code: "storage/canceled" }));
            })
        };
        const handle = uploadFile(new File(["x"], "notes.txt"), {
            channelId: "general",
            communityId: "community-1",
            uploadedBy: "user-1"
        });

        handle.cancel();
        await expect(handle.promise).rejects.toMatchObject({
            code: "file/cancelled"
        });
        expect(mocks.task.cancel).toHaveBeenCalled();
    });

    test("returns actionable Firebase Storage errors", async () => {
        mocks.task = {
            snapshot: { ref: {} },
            cancel: vi.fn(),
            on: vi.fn((_event, _progress, error) => {
                queueMicrotask(() => error({ code: "storage/quota-exceeded" }));
            })
        };
        const handle = uploadFile(new File(["x"], "notes.txt"), {
            channelId: "general",
            communityId: "community-1",
            uploadedBy: "user-1"
        });

        await expect(handle.promise).rejects.toMatchObject({
            code: "storage/quota-exceeded",
            message:
                "File storage is currently full. Contact an administrator before retrying."
        });
    });

    test("cleans up storage when metadata creation fails", async () => {
        mocks.setDoc.mockRejectedValue(new Error("metadata unavailable"));
        const handle = uploadFile(new File(["x"], "notes.txt"), {
            channelId: "general",
            communityId: "community-1",
            uploadedBy: "user-1"
        });

        await expect(handle.promise).rejects.toThrow(
            "Check your connection and retry the file operation."
        );
        expect(mocks.deleteObject).toHaveBeenCalled();
    });

    test("downloads using the original filename", () => {
        const click = vi
            .spyOn(HTMLAnchorElement.prototype, "click")
            .mockImplementation(() => {});
        downloadFile({
            id: "file-1",
            originalName: "Assignment.pdf",
            uploadedBy: "user-1",
            url: "https://files.test/assignment.pdf"
        });

        expect(click).toHaveBeenCalled();
        click.mockRestore();
    });

    test("loads and enriches resources from the user's communities", async () => {
        mocks.getDocs
            .mockResolvedValueOnce({
                docs: [
                    {
                        ref: {
                            parent: { parent: { id: "community-1" } }
                        }
                    }
                ]
            })
            .mockResolvedValueOnce({
                docs: [
                    {
                        id: "general",
                        data: () => ({ name: "General" })
                    }
                ]
            })
            .mockResolvedValueOnce({
                docs: [
                    {
                        id: "resource-1",
                        data: () => ({
                            channelId: "general",
                            communityId: "community-1",
                            originalName: "Exam guide.pdf",
                            uploadedBy: "user-2",
                            uploadedByName: "Sam"
                        })
                    }
                ]
            });
        mocks.getDoc.mockResolvedValue({
            data: () => ({ name: "Computer Science" }),
            exists: () => true
        });

        await expect(getResourceLibrary("user-1")).resolves.toEqual([
            expect.objectContaining({
                communityName: "Computer Science",
                originalName: "Exam guide.pdf",
                resourceKey: "community-1:general:resource-1",
                title: "Exam guide"
            })
        ]);
    });

    test("loads and toggles the user's resource favourites", async () => {
        mocks.getDocs.mockResolvedValue({
            docs: [
                {
                    id: "favorite-1",
                    data: () => ({ resourceKey: "community:channel:file" })
                }
            ]
        });

        await expect(getResourceFavorites("user-1")).resolves.toEqual({
            "community:channel:file": "favorite-1"
        });
        await expect(
            setResourceFavorite("user-1", "community:channel:file")
        ).resolves.toBe("file-1");
        expect(mocks.setDoc).toHaveBeenCalledWith(
            expect.objectContaining({ id: "file-1" }),
            expect.objectContaining({
                resourceKey: "community:channel:file",
                userId: "user-1"
            })
        );

        await expect(
            setResourceFavorite(
                "user-1",
                "community:channel:file",
                "favorite-1"
            )
        ).resolves.toBeNull();
        expect(mocks.deleteDoc).toHaveBeenCalledWith(
            expect.objectContaining({ id: "favorite-1" })
        );
    });

    test("loads one combined library payload with favourites and open history", async () => {
        mocks.getDocs
            .mockResolvedValueOnce({
                docs: [
                    {
                        ref: { parent: { parent: { id: "community-1" } } }
                    }
                ]
            })
            .mockResolvedValueOnce({
                docs: [
                    {
                        id: "favorite-1",
                        data: () => ({
                            createdAt: "favorite-date",
                            resourceKey: "community-1:general:resource-1"
                        })
                    }
                ]
            })
            .mockResolvedValueOnce({
                docs: [
                    {
                        data: () => ({
                            lastOpened: "opened-date",
                            resourceId: "community-1:general:resource-1"
                        })
                    }
                ]
            })
            .mockResolvedValueOnce({
                docs: [
                    {
                        id: "general",
                        data: () => ({ name: "General" })
                    }
                ]
            })
            .mockResolvedValueOnce({
                docs: [
                    {
                        id: "resource-1",
                        data: () => ({
                            channelId: "general",
                            communityId: "community-1",
                            originalName: "Exam guide.pdf",
                            uploadedBy: "user-2"
                        })
                    }
                ]
            });
        mocks.getDoc.mockResolvedValue({
            data: () => ({ name: "Computer Science" }),
            exists: () => true
        });

        await expect(getResourceLibraryData("user-1")).resolves.toMatchObject({
            destinations: [
                {
                    channelId: "general",
                    communityId: "community-1"
                }
            ],
            favorites: {
                "community-1:general:resource-1": "favorite-1"
            },
            resources: [
                {
                    favoriteAt: "favorite-date",
                    lastOpened: "opened-date",
                    resourceKey: "community-1:general:resource-1"
                }
            ]
        });
    });

    test("persists user-scoped resource open history", async () => {
        mocks.getDocs.mockResolvedValue({
            docs: Array.from({ length: 12 }, (_, index) => ({
                id: `activity-${index}`,
                ref: { id: `activity-${index}` }
            }))
        });
        await recordResourceOpened("user-1", "community-1:general:resource-1");

        expect(mocks.setDoc).toHaveBeenCalledWith(
            expect.objectContaining({
                id: "community-1:general:resource-1"
            }),
            expect.objectContaining({
                lastOpened: mocks.timestamp,
                resourceId: "community-1:general:resource-1",
                userId: "user-1"
            }),
            { merge: true }
        );
        expect(mocks.deleteDoc).toHaveBeenCalledTimes(2);
        expect(mocks.deleteDoc).toHaveBeenCalledWith({ id: "activity-10" });
    });
});
