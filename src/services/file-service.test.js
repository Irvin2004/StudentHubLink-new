import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    createActivity: vi.fn(),
    deleteDoc: vi.fn(),
    deleteObject: vi.fn(),
    getDownloadURL: vi.fn(),
    setDoc: vi.fn(),
    timestamp: { _methodName: "serverTimestamp" },
    task: null
}));

vi.mock("firebase/firestore", () => ({
    collection: (...segments) => ({
        path: segments.map((segment) => segment.path || segment).join("/")
    }),
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
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    limit: vi.fn(),
    onSnapshot: vi.fn(),
    orderBy: vi.fn(),
    query: vi.fn(),
    serverTimestamp: () => mocks.timestamp,
    setDoc: mocks.setDoc
}));

vi.mock("firebase/storage", () => ({
    deleteObject: mocks.deleteObject,
    getDownloadURL: mocks.getDownloadURL,
    ref: (_storage, path) => ({ path }),
    uploadBytesResumable: () => mocks.task
}));

vi.mock("../firebase/index.js", () => ({
    auth: { currentUser: { uid: "user-1" } },
    db: { path: "db" },
    storage: { path: "storage" }
}));

vi.mock("./activity-service.js", () => ({
    createActivity: mocks.createActivity
}));

import { downloadFile, uploadFile } from "./file-service.js";

describe("file service", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.getDownloadURL.mockResolvedValue(
            "https://files.test/assignment.pdf"
        );
        mocks.setDoc.mockResolvedValue();
        mocks.deleteObject.mockResolvedValue();
        mocks.createActivity.mockResolvedValue("activity-1");
        mocks.task = {
            snapshot: { ref: { path: "stored-file" } },
            cancel: vi.fn(),
            on: vi.fn((_event, progress, _error, complete) => {
                progress({ bytesTransferred: 68, totalBytes: 100 });
                queueMicrotask(complete);
            })
        };
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

        expect(onProgress).toHaveBeenCalledWith(68);
        expect(mocks.setDoc).toHaveBeenCalledWith(
            expect.objectContaining({ id: "file-1" }),
            expect.objectContaining({
                originalName: "Assignment.pdf",
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
});
