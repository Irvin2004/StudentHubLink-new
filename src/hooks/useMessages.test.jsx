import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    listenToMessages: vi.fn(),
    listenToTyping: vi.fn(),
    pinMessage: vi.fn(),
    sendMessage: vi.fn(),
    stopTyping: vi.fn(),
    unpinMessage: vi.fn(),
    unsubscribeMessages: vi.fn(),
    unsubscribeTyping: vi.fn()
}));

vi.mock("./useAuth.js", () => ({
    useAuth: () => ({
        profile: { displayName: "Alex", photoURL: null },
        user: { uid: "user-1", displayName: "Alex" }
    })
}));

vi.mock("../services/message-service.js", () => ({
    addReaction: vi.fn(),
    createMessageId: vi.fn(() => "message-2"),
    deleteMessage: vi.fn(),
    editMessage: vi.fn(),
    listenToMessages: mocks.listenToMessages,
    listenToTyping: mocks.listenToTyping,
    loadOlderMessages: vi.fn(),
    removeReaction: vi.fn(),
    sendMessage: mocks.sendMessage,
    sendTyping: vi.fn(),
    stopTyping: mocks.stopTyping,
    pinMessage: mocks.pinMessage,
    unpinMessage: mocks.unpinMessage
}));

import { useMessages } from "./useMessages.js";

describe("useMessages", () => {
    let messagesListener;
    let typingListener;

    beforeEach(() => {
        vi.clearAllMocks();
        mocks.listenToMessages.mockImplementation(
            (_communityId, _channelId, onData) => {
                messagesListener = onData;
                return mocks.unsubscribeMessages;
            }
        );
        mocks.listenToTyping.mockImplementation(
            (_communityId, _channelId, onData) => {
                typingListener = onData;
                return mocks.unsubscribeTyping;
            }
        );
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test("applies real-time message updates and sends through the service", async () => {
        mocks.sendMessage.mockResolvedValue({ id: "message-2" });
        const { result } = renderHook(() =>
            useMessages("general", { communityId: "community-1" })
        );

        act(() => {
            messagesListener({
                messages: [{ id: "message-1", text: "Hello" }],
                oldestSnapshot: { id: "message-1" }
            });
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.messages).toEqual([
            { id: "message-1", text: "Hello" }
        ]);

        await act(() => result.current.sendMessage("New message"));
        expect(result.current.messages).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: "message-2",
                    text: "New message",
                    deliveryStatus: "sent"
                })
            ])
        );
        expect(mocks.sendMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                communityId: "community-1",
                channelId: "general",
                senderId: "user-1",
                text: "New message"
            })
        );
    });

    test("shows failed optimistic messages and retries them", async () => {
        mocks.sendMessage
            .mockRejectedValueOnce(new Error("Offline"))
            .mockResolvedValueOnce({ id: "message-2" });
        const { result } = renderHook(() =>
            useMessages("general", { communityId: "community-1" })
        );

        act(() => {
            messagesListener({ messages: [], oldestSnapshot: null });
        });
        await act(async () => {
            result.current.sendMessage("Try again");
            await Promise.resolve();
        });
        expect(result.current.messages[0]).toMatchObject({
            id: "message-2",
            deliveryStatus: "failed",
            deliveryError: "Offline"
        });

        await act(() => result.current.retryMessage("message-2"));
        expect(mocks.sendMessage).toHaveBeenCalledTimes(2);
        expect(result.current.messages[0].deliveryStatus).toBe("sent");
    });

    test("hides stale typing users and clears active users after timeout", async () => {
        vi.useFakeTimers();
        const now = Date.now();
        const { result } = renderHook(() =>
            useMessages("general", { communityId: "community-1" })
        );

        act(() => {
            typingListener([
                {
                    userId: "user-2",
                    displayName: "Lerato",
                    updatedAt: { toMillis: () => now }
                },
                {
                    userId: "user-3",
                    displayName: "Old user",
                    updatedAt: { toMillis: () => now - 6000 }
                }
            ]);
        });
        expect(result.current.typingUsers).toEqual([
            expect.objectContaining({ displayName: "Lerato" })
        ]);

        act(() => {
            vi.advanceTimersByTime(5000);
        });
        expect(result.current.typingUsers).toEqual([]);
    });

    test("subscribes only while the messages view is enabled and cleans up", () => {
        const { rerender, unmount } = renderHook(
            ({ enabled }) =>
                useMessages("general", {
                    communityId: "community-1",
                    enabled
                }),
            { initialProps: { enabled: false } }
        );

        expect(mocks.listenToMessages).not.toHaveBeenCalled();
        expect(mocks.listenToTyping).not.toHaveBeenCalled();

        rerender({ enabled: true });
        expect(mocks.listenToMessages).toHaveBeenCalledOnce();
        expect(mocks.listenToTyping).toHaveBeenCalledOnce();

        unmount();
        expect(mocks.unsubscribeMessages).toHaveBeenCalledOnce();
        expect(mocks.unsubscribeTyping).toHaveBeenCalledOnce();
    });
});
