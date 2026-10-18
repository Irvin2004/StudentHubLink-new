import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    loadOlder: vi.fn(),
    markAllRead: vi.fn(),
    retryNotifications: vi.fn(),
    setRead: vi.fn(),
    state: {},
    track: vi.fn(),
    updateSettings: vi.fn()
}));

vi.mock("../../hooks/useAnalytics.js", () => ({
    useAnalytics: () => ({ track: mocks.track })
}));
vi.mock("../../hooks/useDocumentTitle.js", () => ({
    useDocumentTitle: vi.fn()
}));
vi.mock("../../hooks/useNotifications.js", () => ({
    useNotifications: () => mocks.state
}));
vi.mock("../../hooks/useSettings.js", () => ({
    useSettings: () => ({
        settings: {
            notifications: {
                enabled: true,
                groupMessages: true,
                mentions: true,
                reactions: true
            }
        },
        updateSettings: mocks.updateSettings
    })
}));

import NotificationsPage from "./NotificationsPage.jsx";

function notification(overrides = {}) {
    return {
        createdAt: new Date("2026-09-22T10:00:00Z"),
        id: "notification-1",
        message: "You have a new message.",
        read: false,
        route: "/app/messages",
        senderName: "Alex",
        title: "New message",
        type: "new_message",
        ...overrides
    };
}

function renderPage() {
    return render(
        <MemoryRouter>
            <NotificationsPage />
        </MemoryRouter>
    );
}

beforeEach(() => {
    mocks.loadOlder.mockReset();
    mocks.markAllRead.mockReset();
    mocks.retryNotifications.mockReset();
    mocks.setRead.mockReset();
    mocks.track.mockReset();
    mocks.updateSettings.mockReset();
    mocks.state = {
        error: null,
        hasMoreNotifications: true,
        loadOlder: mocks.loadOlder,
        loading: false,
        loadingOlderNotifications: false,
        markAllRead: mocks.markAllRead,
        notifications: [notification()],
        retryNotifications: mocks.retryNotifications,
        setRead: mocks.setRead,
        unreadCount: 1
    };
});

describe("NotificationsPage", () => {
    test("renders the unread state and supports keyboard-accessible actions", () => {
        renderPage();

        expect(
            screen.getByRole("button", {
                name: "Unread notification: New message"
            })
        ).toBeInTheDocument();
        expect(screen.getByText("1 unread updates")).toBeInTheDocument();

        fireEvent.click(
            screen.getByRole("button", {
                name: "Unread notification: New message"
            })
        );
        expect(mocks.setRead).toHaveBeenCalledWith("notification-1", true);

        fireEvent.click(
            screen.getByRole("button", {
                name: "Mark all 1 unread notifications as read"
            })
        );
        expect(mocks.markAllRead).toHaveBeenCalledOnce();

        fireEvent.click(
            screen.getByRole("button", { name: "Load older notifications" })
        );
        expect(mocks.loadOlder).toHaveBeenCalledOnce();
    });

    test("renders loading, empty, and retryable error states", () => {
        mocks.state = { ...mocks.state, loading: true };
        const { rerender } = renderPage();
        expect(screen.getByRole("status")).toHaveAccessibleName(
            "Loading notifications"
        );

        mocks.state = {
            ...mocks.state,
            loading: false,
            notifications: [],
            unreadCount: 0
        };
        rerender(
            <MemoryRouter>
                <NotificationsPage />
            </MemoryRouter>
        );
        expect(screen.getByText("You're all caught up")).toBeInTheDocument();

        mocks.state = {
            ...mocks.state,
            error: new Error("offline")
        };
        rerender(
            <MemoryRouter>
                <NotificationsPage />
            </MemoryRouter>
        );
        fireEvent.click(screen.getByRole("button", { name: "Try again" }));
        expect(mocks.retryNotifications).toHaveBeenCalledOnce();
    });
});
