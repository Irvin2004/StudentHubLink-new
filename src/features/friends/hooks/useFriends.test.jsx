import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    getConnections: vi.fn(),
    sendFriendRequest: vi.fn(),
    showToast: vi.fn()
}));

vi.mock("../../../hooks/useAuth.js", () => ({
    useAuth: () => ({
        profile: { displayName: "Alex", id: "user-1" },
        user: { uid: "user-1" }
    })
}));

vi.mock("../../../hooks/useToast.js", () => ({
    useToast: () => ({ showToast: mocks.showToast })
}));

vi.mock("../services/friend-service.js", () => ({
    acceptFriendRequest: vi.fn(),
    cancelFriendRequest: vi.fn(),
    declineFriendRequest: vi.fn(),
    getConnections: mocks.getConnections,
    removeFriend: vi.fn(),
    searchPeople: vi.fn(),
    sendFriendRequest: mocks.sendFriendRequest
}));

import { useFriends } from "./useFriends.js";

beforeEach(() => {
    vi.clearAllMocks();
    mocks.getConnections.mockResolvedValue({
        friends: [],
        incoming: [],
        outgoing: []
    });
});

test("shows feedback and refreshes after friend actions", async () => {
    mocks.sendFriendRequest.mockResolvedValue("user-1_user-2");
    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
        await result.current.send({ id: "user-2", displayName: "Sam" });
    });

    expect(mocks.showToast).toHaveBeenCalledWith({
        message: "Friend request sent to Sam.",
        type: "success"
    });
    await waitFor(() => expect(mocks.getConnections).toHaveBeenCalledTimes(2));
});

test("shows the service error when a duplicate request is rejected", async () => {
    mocks.sendFriendRequest.mockRejectedValue(
        new Error("Friend request already sent.")
    );
    const { result } = renderHook(() => useFriends());

    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
        await result.current.send({ id: "user-2", displayName: "Sam" });
    });

    expect(mocks.showToast).toHaveBeenCalledWith({
        message: "Friend request already sent.",
        type: "error"
    });
});
