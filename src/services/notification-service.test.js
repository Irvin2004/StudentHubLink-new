import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    documents: new Map(),
    getDocs: vi.fn(),
    onSnapshot: vi.fn(),
    runTransaction: vi.fn(),
    serverTimestamp: vi.fn(() => "server-timestamp")
}));

vi.mock("firebase/firestore", () => ({
    collection: (...parts) => ({
        path: parts.map((part) => part.path || part).join("/")
    }),
    doc: (...parts) => {
        const collectionReference = parts[0];
        const id = parts[1] || "generated-notification";
        return { id, path: `${collectionReference.path}/${id}` };
    },
    documentId: vi.fn(() => "__name__"),
    getDocs: mocks.getDocs,
    limit: vi.fn((value) => ({ limit: value })),
    onSnapshot: mocks.onSnapshot,
    orderBy: vi.fn((field, direction) => ({ direction, orderBy: field })),
    query: vi.fn((...parts) => parts),
    runTransaction: mocks.runTransaction,
    serverTimestamp: mocks.serverTimestamp,
    startAfter: vi.fn((cursor) => ({ startAfter: cursor })),
    updateDoc: vi.fn(),
    where: vi.fn(),
    writeBatch: vi.fn()
}));
vi.mock("../firebase/index.js", () => ({ db: { path: "db" } }));

import {
    createNotification,
    listenToNotifications,
    loadOlderNotifications,
    mergeNotificationPages
} from "./notification-service.js";

function notification() {
    return {
        eventId: "friend-request-request-1",
        message: "Alex sent you a friend request.",
        referenceId: "request-1",
        senderId: "alex",
        title: "New friend request",
        type: "friend_request"
    };
}

beforeEach(() => {
    mocks.documents.clear();
    mocks.getDocs.mockReset();
    mocks.onSnapshot.mockReset();
    mocks.runTransaction.mockClear();
    mocks.serverTimestamp.mockClear();
    mocks.runTransaction.mockImplementation(async (_db, callback) =>
        callback({
            get: async (reference) => ({
                exists: () => mocks.documents.has(reference.path)
            }),
            set: (reference, data) => mocks.documents.set(reference.path, data)
        })
    );
});

function notificationDocument(id, createdAt, read = false) {
    return {
        data: () => ({
            createdAt,
            message: `Message ${id}`,
            read,
            title: `Notification ${id}`,
            type: "new_message"
        }),
        id
    };
}

describe("createNotification", () => {
    test("uses one deterministic document for duplicate event delivery", async () => {
        await expect(createNotification("sam", notification())).resolves.toBe(
            "friend-request-request-1"
        );
        await expect(createNotification("sam", notification())).resolves.toBe(
            "friend-request-request-1"
        );

        expect(mocks.documents).toHaveLength(1);
        expect(mocks.runTransaction).toHaveBeenCalledTimes(2);
    });

    test("does not reset a read notification during an event retry", async () => {
        await createNotification("sam", notification());
        const [path, saved] = mocks.documents.entries().next().value;
        mocks.documents.set(path, { ...saved, read: true });

        await createNotification("sam", notification());

        expect(mocks.documents.get(path)).toEqual(
            expect.objectContaining({ read: true })
        );
    });
});

describe("notification paging", () => {
    test("uses a stable created-at and document-ID ordering for the live window", () => {
        const onData = vi.fn();
        mocks.onSnapshot.mockReturnValue(vi.fn());

        listenToNotifications("sam", onData, vi.fn());

        const queryParts = mocks.onSnapshot.mock.calls[0][0];
        expect(queryParts).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    direction: "desc",
                    orderBy: "createdAt"
                }),
                expect.objectContaining({
                    direction: "desc",
                    orderBy: "__name__"
                }),
                expect.objectContaining({ limit: 50 })
            ])
        );
        expect(
            mergeNotificationPages([
                { createdAt: 100, id: "a" },
                { createdAt: 100, id: "z" }
            ])
        ).toEqual([
            expect.objectContaining({ id: "z" }),
            expect.objectContaining({ id: "a" })
        ]);
    });

    test("keeps the latest 50-item live window and exposes its cursor", () => {
        const onData = vi.fn();
        mocks.onSnapshot.mockReturnValue(vi.fn());
        listenToNotifications("sam", onData, vi.fn());
        const allNotifications = Array.from({ length: 51 }, (_, index) =>
            notificationDocument(`notification-${index}`, 1000 - index)
        );
        const latestWindow = allNotifications.slice(0, 50);

        mocks.onSnapshot.mock.calls[0][1]({ docs: latestWindow });

        expect(onData).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({ id: "notification-0" })
            ]),
            expect.objectContaining({
                cursor: latestWindow[49],
                hasMore: true
            })
        );
        expect(onData.mock.calls[0][0]).not.toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: "notification-50" })
            ])
        );
    });

    test("loads the next older page strictly after the live cursor", async () => {
        const liveCursor = notificationDocument("notification-49", 951);
        const olderDocument = notificationDocument("notification-50", 950);
        mocks.getDocs.mockResolvedValue({ docs: [olderDocument] });

        await expect(
            loadOlderNotifications("sam", liveCursor)
        ).resolves.toEqual(
            expect.objectContaining({
                cursor: olderDocument,
                hasMore: false,
                notifications: [
                    expect.objectContaining({ id: "notification-50" })
                ]
            })
        );

        const queryParts = mocks.getDocs.mock.calls[0][0];
        expect(queryParts).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ startAfter: liveCursor })
            ])
        );
    });

    test("deduplicates live and page results while retaining optimistic read state", () => {
        const merged = mergeNotificationPages(
            [
                { createdAt: 20, id: "newer", read: false },
                { createdAt: 10, id: "shared", read: true }
            ],
            [
                { createdAt: 10, id: "shared", read: false },
                { createdAt: 5, id: "older", read: false }
            ]
        );

        expect(merged).toEqual([
            expect.objectContaining({ id: "newer" }),
            expect.objectContaining({ id: "shared", read: true }),
            expect.objectContaining({ id: "older" })
        ]);
        expect(merged).toHaveLength(3);
    });
});
