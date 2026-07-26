import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";

import { NetworkProvider } from "../../context/NetworkContext.jsx";
import { useNetwork } from "../../hooks/useNetwork.js";
import NetworkStatus from "./NetworkStatus.jsx";

const showToast = vi.hoisted(() => vi.fn());

vi.mock("../../hooks/useToast.js", () => ({
    useToast: () => ({ showToast })
}));

function setOnline(value) {
    Object.defineProperty(window.navigator, "onLine", {
        configurable: true,
        value
    });
}

function NetworkProbe() {
    const { isOnline } = useNetwork();
    return <output>{isOnline ? "online" : "offline"}</output>;
}

function renderNetwork(children) {
    return render(<NetworkProvider>{children}</NetworkProvider>);
}

describe("NetworkProvider and NetworkStatus", () => {
    afterEach(() => {
        cleanup();
        setOnline(true);
        showToast.mockReset();
        vi.useRealTimers();
    });

    test("reports the initial browser network state", () => {
        setOnline(true);
        renderNetwork(<NetworkProbe />);

        expect(screen.getByText("online")).toBeVisible();
    });

    test("updates consumers for offline and online browser events", () => {
        setOnline(true);
        renderNetwork(<NetworkProbe />);

        act(() => window.dispatchEvent(new Event("offline")));
        expect(screen.getByText("offline")).toBeVisible();

        act(() => window.dispatchEvent(new Event("online")));
        expect(screen.getByText("online")).toBeVisible();
    });

    test("shows and manually dismisses the offline banner", async () => {
        setOnline(false);
        const user = userEvent.setup();
        renderNetwork(<NetworkStatus />);

        expect(screen.getByRole("alert")).toHaveTextContent("You're offline");
        await user.click(
            screen.getByRole("button", {
                name: "Dismiss offline notification"
            })
        );
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    test("debounces recovery, shows success, and hides automatically", () => {
        vi.useFakeTimers();
        setOnline(true);
        renderNetwork(<NetworkStatus />);

        act(() => window.dispatchEvent(new Event("offline")));
        act(() => vi.advanceTimersByTime(450));
        expect(screen.getByRole("alert")).toHaveTextContent("You're offline");

        act(() => window.dispatchEvent(new Event("online")));
        act(() => vi.advanceTimersByTime(450));
        expect(screen.getByRole("status")).toHaveTextContent(
            "You're back online"
        );
        expect(showToast).toHaveBeenCalledWith(
            expect.objectContaining({ type: "success" })
        );

        act(() => vi.advanceTimersByTime(3500));
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
});
