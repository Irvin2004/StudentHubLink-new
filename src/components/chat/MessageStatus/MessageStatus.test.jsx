import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import MessageStatus from "./MessageStatus.jsx";

describe("MessageStatus", () => {
    test("announces sending and sent states", () => {
        const { rerender } = render(<MessageStatus status="sending" />);
        expect(screen.getByRole("status")).toHaveTextContent("Sending");

        rerender(<MessageStatus status="sent" />);
        expect(screen.getByLabelText("Sent")).toBeInTheDocument();
    });

    test("offers retry for failed messages", () => {
        const onRetry = vi.fn();
        render(<MessageStatus onRetry={onRetry} status="failed" />);

        fireEvent.click(screen.getByRole("button", { name: "Retry" }));
        expect(onRetry).toHaveBeenCalledOnce();
    });
});
