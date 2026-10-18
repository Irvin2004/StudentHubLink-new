import {
    act,
    fireEvent,
    render,
    screen,
    waitFor
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    captureError: vi.fn(),
    listeners: [],
    loadOlderNotifications: vi.fn(),
    markAllNotificationsRead: vi.fn(),
    markNotification: vi.fn(),
    mergeNotificationPages: vi.fn((current, incoming) => [
        ...new Map(
            [...incoming, ...current].map((notification) => [
                notification.id,
                notification
            ])
        ).values()
    ]),
    showToast: vi.fn()
}));

vi.mock("../hooks/useAuth.js", () => ({
    useAuth: () => ({ user: { uid: "student-1" } })
}));
vi.mock("../hooks/useSettings.js", () => ({
    useSettings: () => ({ settings: { notifications: { enabled: true } } })
}));
vi.mock("../hooks/useToast.js", () => ({
    useToast: () => ({ showToast: mocks.showToast })
}));
vi.mock("../services/observability-service.js", () => ({
    captureError: mocks.captureError
}));
vi.mock("../services/notification-service.js", () => ({
    listenToNotifications: vi.fn((userId, onData, onError) => {
        const listener = { onData, onError, unsubscribe: vi.fn() };
        mocks.listeners.push(listener);
        return listener.unsubscribe;
    }),
    loadOlderNotifications: mocks.loadOlderNotifications,
    mergeNotificationPages: mocks.mergeNotificationPages,
    markAllNotificationsRead: mocks.markAllNotificationsRead,
    markNotification: mocks.markNotification
}));

import { NotificationProvider } from "./NotificationContext.jsx";
import { useNotifications } from "../hooks/useNotifications.js";

function notification(id, read = false) {
    return {
        id,
        message: `Message ${id}`,
        read,
        title: `Notification ${id}`,
        type: "new_message"
    };
}

function Probe() {
    const {
        error,
        loadOlder,
        loading,
        markAllRead,
        notifications,
        setRead,
        unreadCount
    } = useNotifications();

    return (
        <>
            <output data-testid="notifications">
                {notifications
                    .map((item) => `${item.id}:${item.read}`)
                    .join(",")}
            </output>
            <output data-testid="unread-count">{unreadCount}</output>
            <output data-testid="loading">{String(loading)}</output>
            <output data-testid="error">{error?.message || ""}</output>
            <button onClick={() => void setRead("one", true)} type="button">
                Read one
            </button>
            <button onClick={() => void setRead("one", false)} type="button">
                Unread one
            </button>
            <button onClick={() => void markAllRead()} type="button">
                Read all
            </button>
            <button onClick={() => void loadOlder()} type="button">
                Load older
            </button>
        </>
    );
}

async function renderProvider(initialNotifications, page = {}) {
    render(
        <NotificationProvider>
            <Probe />
        </NotificationProvider>
    );
    await waitFor(() => expect(mocks.listeners).toHaveLength(1));
    act(() =>
        mocks.listeners[0].onData(initialNotifications, {
            cursor: page.cursor || { id: initialNotifications.at(-1)?.id },
            hasMore: page.hasMore || false
        })
    );
}

beforeEach(() => {
    mocks.listeners.length = 0;
    mocks.captureError.mockReset();
    mocks.loadOlderNotifications.mockReset().mockResolvedValue({
        cursor: null,
        hasMore: false,
        notifications: []
    });
    mocks.showToast.mockReset();
    mocks.markNotification.mockReset().mockResolvedValue();
    mocks.markAllNotificationsRead.mockReset().mockResolvedValue();
});

afterEach(() => vi.useRealTimers());

describe("NotificationProvider delivery state", () => {
    test("optimistically marks one notification read and unread with a correct count", async () => {
        await renderProvider([notification("one"), notification("two", true)]);

        fireEvent.click(screen.getByRole("button", { name: "Read one" }));
        expect(screen.getByTestId("notifications")).toHaveTextContent(
            "one:true,two:true"
        );
        expect(screen.getByTestId("unread-count")).toHaveTextContent("0");

        fireEvent.click(screen.getByRole("button", { name: "Unread one" }));
        expect(screen.getByTestId("notifications")).toHaveTextContent(
            "one:false,two:true"
        );
        expect(screen.getByTestId("unread-count")).toHaveTextContent("1");
    });

    test("optimistically marks every notification read", async () => {
        await renderProvider([notification("one"), notification("two")]);

        fireEvent.click(screen.getByRole("button", { name: "Read all" }));

        expect(screen.getByTestId("notifications")).toHaveTextContent(
            "one:true,two:true"
        );
        expect(screen.getByTestId("unread-count")).toHaveTextContent("0");
    });

    test("rolls back a failed mutation and reports it through the toast path", async () => {
        mocks.markNotification.mockRejectedValueOnce(new Error("write failed"));
        await renderProvider([notification("one")]);

        fireEvent.click(screen.getByRole("button", { name: "Read one" }));
        expect(screen.getByTestId("notifications")).toHaveTextContent(
            "one:true"
        );

        await waitFor(() =>
            expect(screen.getByTestId("notifications")).toHaveTextContent(
                "one:false"
            )
        );
        expect(screen.getByTestId("error")).toHaveTextContent("write failed");
        expect(mocks.showToast).toHaveBeenCalledWith(
            expect.objectContaining({ type: "error" })
        );
    });

    test("merges older pages without duplicating or resetting the live read state", async () => {
        const cursor = { id: "one" };
        mocks.loadOlderNotifications.mockResolvedValueOnce({
            cursor: { id: "two" },
            hasMore: false,
            notifications: [notification("one", false), notification("two")]
        });
        await renderProvider([notification("one", true)], {
            cursor,
            hasMore: true
        });

        fireEvent.click(screen.getByRole("button", { name: "Load older" }));

        await waitFor(() =>
            expect(screen.getByTestId("notifications")).toHaveTextContent(
                "one:true,two:false"
            )
        );
        expect(mocks.loadOlderNotifications).toHaveBeenCalledWith(
            "student-1",
            cursor
        );
    });

    test("reconnects after a listener error and clears the recovered error state", async () => {
        await renderProvider([notification("one")]);
        vi.useFakeTimers();

        act(() => mocks.listeners[0].onError(new Error("listener failed")));
        expect(screen.getByTestId("error")).toHaveTextContent(
            "listener failed"
        );
        expect(screen.getByTestId("loading")).toHaveTextContent("false");

        act(() => vi.advanceTimersByTime(1000));
        expect(mocks.listeners).toHaveLength(2);
        act(() =>
            mocks.listeners[1].onData([notification("two")], {
                cursor: { id: "two" },
                hasMore: false
            })
        );

        expect(screen.getByTestId("notifications")).toHaveTextContent(
            "two:false"
        );
        expect(screen.getByTestId("error")).toBeEmptyDOMElement();
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });
});
