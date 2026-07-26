import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ToastProvider } from "../../context/ToastContext.jsx";
import { useToast } from "../../hooks/useToast.js";
import ToastContainer from "./ToastContainer.jsx";

function ToastHarness() {
    const { showToast } = useToast();

    return (
        <>
            <button
                onClick={() =>
                    showToast({
                        duration: 4000,
                        message: "Community created.",
                        type: "success"
                    })
                }
                type="button"
            >
                Show success
            </button>
            <button
                onClick={() =>
                    showToast({
                        duration: 4000,
                        message: "Upload failed.",
                        type: "error"
                    })
                }
                type="button"
            >
                Show error
            </button>
            <button
                onClick={() =>
                    showToast({
                        duration: 0,
                        message: "You are offline.",
                        type: "warning"
                    })
                }
                type="button"
            >
                Show warning
            </button>
            <ToastContainer />
        </>
    );
}

function renderToasts() {
    return render(
        <ToastProvider>
            <ToastHarness />
        </ToastProvider>
    );
}

describe("toast notification system", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("renders accessible type-specific notifications", () => {
        renderToasts();

        fireEvent.click(screen.getByRole("button", { name: "Show success" }));
        const success = screen.getByRole("status");
        expect(success).toHaveTextContent("Success notification:");
        expect(success).toHaveAttribute("data-type", "success");

        fireEvent.click(screen.getByRole("button", { name: "Show error" }));
        const error = screen.getByRole("alert");
        expect(error).toHaveTextContent("Error notification:");
        expect(error).toHaveAttribute("data-type", "error");
    });

    it("queues multiple toasts with the newest first", () => {
        renderToasts();

        fireEvent.click(screen.getByRole("button", { name: "Show success" }));
        fireEvent.click(screen.getByRole("button", { name: "Show warning" }));

        const notifications = screen.getByTestId("toast-container");
        expect(notifications.children).toHaveLength(2);
        expect(notifications.children[0]).toHaveTextContent("You are offline.");
        expect(notifications.children[1]).toHaveTextContent(
            "Community created."
        );
    });

    it("auto-dismisses after the configured duration and exit animation", () => {
        renderToasts();
        fireEvent.click(screen.getByRole("button", { name: "Show success" }));

        act(() => vi.advanceTimersByTime(4000));
        expect(screen.getByRole("status")).toHaveAttribute(
            "data-dismissing",
            "true"
        );

        act(() => vi.advanceTimersByTime(160));
        expect(screen.queryByText("Community created.")).toBeNull();
    });

    it("supports immediate manual dismissal", () => {
        renderToasts();
        fireEvent.click(screen.getByRole("button", { name: "Show warning" }));

        fireEvent.click(
            screen.getByRole("button", {
                name: "Dismiss warning notification"
            })
        );
        act(() => vi.advanceTimersByTime(160));

        expect(screen.queryByText("You are offline.")).toBeNull();
    });
});
