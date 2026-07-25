import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    arrayRemove: vi.fn((value) => ({ operation: "remove", value })),
    arrayUnion: vi.fn((value) => ({ operation: "union", value })),
    deleteDoc: vi.fn(),
    getDocs: vi.fn(),
    onSnapshot: vi.fn(),
    setDoc: vi.fn(),
    timestamp: { _methodName: "serverTimestamp" },
    updateDoc: vi.fn()
}));

vi.mock("firebase/firestore", () => ({
    arrayRemove: mocks.arrayRemove,
    arrayUnion: mocks.arrayUnion,
    collection: (...segments) => ({
        kind: "collection",
        path: segments.map((segment) => segment.path || segment).join("/")
    }),
    deleteDoc: mocks.deleteDoc,
    doc: (...segments) => {
        if (segments.length === 1) {
            return {
                id: "message-1",
                kind: "message",
                path: `${segments[0].path}/message-1`
            };
        }
        return {
            id: segments.at(-1),
            path: segments.map((segment) => segment.path || segment).join("/")
        };
    },
    endBefore: (value) => ({ type: "endBefore", value }),
    getDocs: mocks.getDocs,
    limitToLast: (value) => ({ type: "limitToLast", value }),
    onSnapshot: mocks.onSnapshot,
    orderBy: (field, direction) => ({ type: "orderBy", field, direction }),
    query: (reference, ...constraints) => ({ reference, constraints }),
    serverTimestamp: () => mocks.timestamp,
    setDoc: mocks.setDoc,
    updateDoc: mocks.updateDoc
}));

vi.mock("../firebase/index.js", () => ({
    auth: { currentUser: { uid: "user-1" } },
    db: { name: "test-db" }
}));

import {
    addReaction,
    deleteMessage,
    editMessage,
    listenToMessages,
    sendMessage,
    sendTyping,
    stopTyping
} from "./message-service.js";

describe("message service", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.setDoc.mockResolvedValue();
        mocks.updateDoc.mockResolvedValue();
        mocks.deleteDoc.mockResolvedValue();
    });

    test("sends a normalized message to the nested channel collection", async () => {
        const message = await sendMessage({
            communityId: "community-1",
            channelId: "general",
            senderId: "user-1",
            senderName: "Alex",
            text: " Hello ",
            replyTo: { id: "message-0", senderName: "Maya", text: "Hi" }
        });

        expect(mocks.setDoc).toHaveBeenCalledWith(
            expect.objectContaining({
                path: expect.stringContaining(
                    "communities/community-1/channels/general/messages"
                )
            }),
            expect.objectContaining({
                text: "Hello",
                replyTo: expect.objectContaining({ id: "message-0" }),
                readBy: ["user-1"],
                edited: false
            })
        );
        expect(message.id).toBe("message-1");
    });

    test("edits and soft deletes messages", async () => {
        await editMessage(
            "community-1",
            "general",
            "message-1",
            "Updated",
            "user-1"
        );
        await deleteMessage("community-1", "general", "message-1", "user-1");

        expect(mocks.updateDoc).toHaveBeenNthCalledWith(
            1,
            expect.anything(),
            expect.objectContaining({ text: "Updated", edited: true })
        );
        expect(mocks.updateDoc).toHaveBeenNthCalledWith(
            2,
            expect.anything(),
            expect.objectContaining({
                text: "",
                deleted: true,
                attachments: []
            })
        );
    });

    test("subscribes to the latest 30 real-time messages", () => {
        const unsubscribe = vi.fn();
        mocks.onSnapshot.mockReturnValue(unsubscribe);

        expect(
            listenToMessages("community-1", "general", vi.fn(), vi.fn())
        ).toBe(unsubscribe);
        expect(mocks.onSnapshot).toHaveBeenCalledWith(
            expect.objectContaining({
                constraints: expect.arrayContaining([
                    expect.objectContaining({
                        type: "limitToLast",
                        value: 30
                    })
                ])
            }),
            expect.any(Function),
            expect.any(Function)
        );
    });

    test("updates reactions and typing independently", async () => {
        await addReaction(
            "community-1",
            "general",
            "message-1",
            "user-1",
            "👍"
        );
        await sendTyping("community-1", "general", "user-1", "Alex");
        await stopTyping("community-1", "general", "user-1");

        expect(mocks.updateDoc).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                "reactions.thumbsUp": {
                    operation: "union",
                    value: "user-1"
                }
            })
        );
        expect(mocks.setDoc).toHaveBeenCalledWith(
            expect.objectContaining({ id: "user-1" }),
            expect.objectContaining({ displayName: "Alex" })
        );
        expect(mocks.deleteDoc).toHaveBeenCalledOnce();
    });
});
