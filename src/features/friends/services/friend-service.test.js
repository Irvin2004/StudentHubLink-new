import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    batch: { commit: vi.fn(), set: vi.fn(), update: vi.fn() },
    createNotification: vi.fn(),
    deleteDoc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    setDoc: vi.fn(),
    timestamp: { type: "timestamp" },
    updateDoc: vi.fn()
}));

vi.mock("firebase/firestore", () => ({
    collection: (...parts) => ({
        path: parts.map((part) => part.path || part).join("/")
    }),
    deleteDoc: mocks.deleteDoc,
    doc: (...parts) => {
        const path = parts.map((part) => part.path || part).join("/");
        return { id: String(parts.at(-1)), path };
    },
    endAt: vi.fn((value) => ({ endAt: value })),
    getDoc: mocks.getDoc,
    getDocs: mocks.getDocs,
    limit: vi.fn((value) => ({ limit: value })),
    orderBy: vi.fn((field) => ({ orderBy: field })),
    query: vi.fn((...parts) => parts),
    serverTimestamp: () => mocks.timestamp,
    setDoc: mocks.setDoc,
    startAt: vi.fn((value) => ({ startAt: value })),
    updateDoc: mocks.updateDoc,
    where: vi.fn((...parts) => ({ where: parts })),
    writeBatch: () => mocks.batch
}));
vi.mock("../../../firebase/index.js", () => ({ db: { path: "db" } }));
vi.mock("../../../services/notification-service.js", () => ({
    createNotification: mocks.createNotification
}));

import {
    acceptFriendRequest,
    cancelFriendRequest,
    declineFriendRequest,
    getConnections,
    removeFriend,
    sendFriendRequest
} from "./friend-service.js";

beforeEach(() => {
    vi.clearAllMocks();
    mocks.batch.commit.mockResolvedValue();
    mocks.createNotification.mockResolvedValue("notification-1");
    mocks.deleteDoc.mockResolvedValue();
    mocks.setDoc.mockResolvedValue();
    mocks.updateDoc.mockResolvedValue();
});

describe("friend service", () => {
    test("sends a pending request and notification", async () => {
        mocks.getDoc
            .mockResolvedValueOnce({ exists: () => false })
            .mockResolvedValueOnce({ exists: () => false });

        await expect(
            sendFriendRequest({ id: "user-1", displayName: "Alex" }, "user-2")
        ).resolves.toBe("user-1_user-2");

        expect(mocks.setDoc).toHaveBeenCalledWith(
            expect.objectContaining({ id: "user-1_user-2" }),
            expect.objectContaining({
                receiverId: "user-2",
                senderId: "user-1",
                status: "pending"
            })
        );
        expect(mocks.createNotification).toHaveBeenCalledWith(
            "user-2",
            expect.objectContaining({
                referenceId: "user-1_user-2",
                route: "/app/friends?tab=requests",
                type: "friend_request"
            })
        );
    });

    test("accepts a request atomically and notifies the sender", async () => {
        await acceptFriendRequest(
            { id: "user-2", displayName: "Sam" },
            { id: "request-1", receiverId: "user-2", senderId: "user-1" }
        );

        expect(mocks.batch.update).toHaveBeenCalledWith(
            expect.objectContaining({ id: "request-1" }),
            expect.objectContaining({ status: "accepted" })
        );
        expect(mocks.batch.set).toHaveBeenCalledWith(
            expect.objectContaining({ id: "user-1_user-2" }),
            expect.objectContaining({ participantIds: ["user-1", "user-2"] })
        );
        expect(mocks.batch.commit).toHaveBeenCalledOnce();
        expect(mocks.createNotification).toHaveBeenCalledWith(
            "user-1",
            expect.objectContaining({ type: "friend_accepted" })
        );
    });

    test("declines, cancels, and removes only the current user's connections", async () => {
        const incoming = {
            id: "request-1",
            receiverId: "user-1",
            senderId: "user-2"
        };
        const outgoing = {
            id: "request-2",
            receiverId: "user-2",
            senderId: "user-1"
        };
        const friend = { id: "friend-1", participantIds: ["user-1", "user-2"] };

        await declineFriendRequest("user-1", incoming);
        await cancelFriendRequest("user-1", outgoing);
        await removeFriend("user-1", friend);

        expect(mocks.updateDoc).toHaveBeenCalledWith(
            expect.objectContaining({ id: "request-1" }),
            expect.objectContaining({ status: "declined" })
        );
        expect(mocks.deleteDoc).toHaveBeenCalledTimes(2);
    });

    test("loads and enriches incoming, outgoing, and friend records", async () => {
        mocks.getDocs
            .mockResolvedValueOnce({
                docs: [
                    {
                        id: "in-1",
                        data: () => ({
                            receiverId: "user-1",
                            senderId: "user-2",
                            status: "pending"
                        })
                    }
                ]
            })
            .mockResolvedValueOnce({
                docs: [
                    {
                        id: "out-1",
                        data: () => ({
                            receiverId: "user-3",
                            senderId: "user-1",
                            status: "pending"
                        })
                    }
                ]
            })
            .mockResolvedValueOnce({
                docs: [
                    {
                        id: "friend-1",
                        data: () => ({ participantIds: ["user-1", "user-4"] })
                    }
                ]
            });
        mocks.getDoc.mockImplementation(async (reference) => ({
            data: () => ({
                displayName: `Profile ${reference.id}`,
                email: `${reference.id}@test.dev`
            }),
            exists: () => true,
            id: reference.id
        }));

        const result = await getConnections("user-1");

        expect(result.incoming[0].person.id).toBe("user-2");
        expect(result.outgoing[0].person.id).toBe("user-3");
        expect(result.friends[0].person.id).toBe("user-4");
    });
});
