import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    listenToMessages: vi.fn(),
    listenToTyping: vi.fn(),
    sendMessage: vi.fn(),
    stopTyping: vi.fn()
}));

vi.mock("./useAuth.js", () => ({
    useAuth: () => ({
        profile: { displayName: "Alex", photoURL: null },
        user: { uid: "user-1", displayName: "Alex" }
    })
}));

vi.mock("../services/message-service.js", () => ({
    addReaction: vi.fn(),
    deleteMessage: vi.fn(),
    editMessage: vi.fn(),
    listenToMessages: mocks.listenToMessages,
    listenToTyping: mocks.listenToTyping,
    loadOlderMessages: vi.fn(),
    removeReaction: vi.fn(),
    sendMessage: mocks.sendMessage,
    sendTyping: vi.fn(),
    stopTyping: mocks.stopTyping
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
                return vi.fn();
            }
        );
        mocks.listenToTyping.mockImplementation(
            (_communityId, _channelId, onData) => {
                typingListener = onData;
                return vi.fn();
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
        expect(mocks.sendMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                communityId: "community-1",
                channelId: "general",
                senderId: "user-1",
                text: "New message"
            })
        );
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
});
