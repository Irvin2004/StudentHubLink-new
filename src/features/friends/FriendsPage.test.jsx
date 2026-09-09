import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

const friends = vi.hoisted(() => ({
    accept: vi.fn(),
    cancel: vi.fn(),
    decline: vi.fn(),
    error: null,
    friends: [
        {
            id: "friend-1",
            participantIds: ["user-1", "user-2"],
            person: {
                id: "user-2",
                displayName: "Sam Friend",
                email: "sam@test.dev"
            }
        }
    ],
    incoming: [
        {
            id: "in-1",
            receiverId: "user-1",
            senderId: "user-3",
            person: { id: "user-3", displayName: "Incoming Student" }
        }
    ],
    loading: false,
    outgoing: [
        {
            id: "out-1",
            receiverId: "user-4",
            senderId: "user-1",
            person: { id: "user-4", displayName: "Outgoing Student" }
        }
    ],
    pending: [],
    relationByUserId: new Map(),
    reload: vi.fn(),
    remove: vi.fn(),
    results: [],
    search: vi.fn(),
    searchError: null,
    searching: false,
    send: vi.fn()
}));

vi.mock("./hooks/useFriends.js", () => ({ useFriends: () => friends }));

import FriendsPage from "./FriendsPage.jsx";

beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/app/friends");
    vi.spyOn(window, "confirm").mockReturnValue(true);
});

test("shows friends and removes with confirmation", () => {
    render(<FriendsPage />);
    expect(screen.getByRole("heading", { name: "Sam Friend" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(window.confirm).toHaveBeenCalled();
    expect(friends.remove).toHaveBeenCalledWith(friends.friends[0]);
});

test("accepts, declines, and cancels friend requests", () => {
    render(<FriendsPage />);
    fireEvent.click(screen.getByRole("button", { name: "Requests (1)" }));
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    fireEvent.click(screen.getByRole("button", { name: "Decline" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel request" }));

    expect(friends.accept).toHaveBeenCalledWith(friends.incoming[0]);
    expect(friends.decline).toHaveBeenCalledWith(friends.incoming[0]);
    expect(friends.cancel).toHaveBeenCalledWith(friends.outgoing[0]);
});

test("searches for people from the Find People tab", () => {
    render(<FriendsPage />);
    fireEvent.click(screen.getByRole("button", { name: "Find People" }));
    fireEvent.change(screen.getByLabelText("Student name or email"), {
        target: { value: "Alex" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(friends.search).toHaveBeenCalledWith("Alex");
});
