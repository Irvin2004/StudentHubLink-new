import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ErrorBoundary from "./ErrorBoundary.jsx";

function ThrowingComponent() {
    throw new Error("Unexpected rendering failure");
}

describe("ErrorBoundary", () => {
    let consoleError;

    beforeEach(() => {
        consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        consoleError.mockRestore();
    });

    it("renders children when no error occurs", () => {
        render(
            <ErrorBoundary>
                <p>StudentHub content</p>
            </ErrorBoundary>
        );

        expect(screen.getByText("StudentHub content")).toBeVisible();
    });

    it("catches rendering errors and displays the friendly fallback", () => {
        const onError = vi.fn();

        render(
            <ErrorBoundary onError={onError}>
                <ThrowingComponent />
            </ErrorBoundary>
        );

        expect(
            screen.getByRole("heading", { name: "Something went wrong" })
        ).toBeVisible();
        expect(
            screen.getByText("StudentHub encountered an unexpected error.")
        ).toBeVisible();
        expect(screen.queryByText("Unexpected rendering failure")).toBeNull();
        expect(onError).toHaveBeenCalledWith(
            expect.any(Error),
            expect.objectContaining({ componentStack: expect.any(String) })
        );
    });

    it("reloads the page from the recovery action", () => {
        const reload = vi.fn();

        render(
            <ErrorBoundary onReload={reload}>
                <ThrowingComponent />
            </ErrorBoundary>
        );

        fireEvent.click(screen.getByRole("button", { name: "Reload Page" }));
        expect(reload).toHaveBeenCalledOnce();
    });

    it("provides a working home recovery link", () => {
        render(
            <ErrorBoundary>
                <ThrowingComponent />
            </ErrorBoundary>
        );

        expect(screen.getByRole("link", { name: "Go Home" })).toHaveAttribute(
            "href",
            "/"
        );
    });
});
