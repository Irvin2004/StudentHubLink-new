import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { AI_ACTIONS } from "../config/ai-action-types.js";
import AIAssistantDialog from "./AIAssistantDialog.jsx";

const baseProps = {
    action: AI_ACTIONS.SUMMARISE_NOTES,
    error: null,
    loading: false,
    onClose: vi.fn(),
    onRetry: vi.fn(),
    onRun: vi.fn(),
    onSave: vi.fn(),
    open: true,
    result: null,
    saveError: null,
    saved: null,
    saving: false
};

test("submits labelled AI input", () => {
    const onRun = vi.fn();
    render(<AIAssistantDialog {...baseProps} onRun={onRun} />);

    fireEvent.change(screen.getByLabelText(/Subject or topic/), {
        target: { value: "Robotics" }
    });
    fireEvent.change(screen.getByLabelText(/Notes or context/), {
        target: {
            value: "Robotics combines sensors, control systems, and actuators to perform useful tasks."
        }
    });
    fireEvent.click(screen.getByRole("button", { name: "Summarise Notes" }));

    expect(onRun).toHaveBeenCalledWith({
        action: AI_ACTIONS.SUMMARISE_NOTES,
        content:
            "Robotics combines sensors, control systems, and actuators to perform useful tasks.",
        subject: "Robotics"
    });
});

test("renders loading, error, and retry states", () => {
    const onRetry = vi.fn();
    const { rerender } = render(
        <AIAssistantDialog {...baseProps} loading onRetry={onRetry} />
    );
    expect(screen.getByText("Working through your notes…")).toBeVisible();

    rerender(
        <AIAssistantDialog
            {...baseProps}
            error={new Error("Add more context.")}
            onRetry={onRetry}
        />
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Add more context.");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
});

test("offers persistence for generated material", () => {
    render(
        <AIAssistantDialog
            {...baseProps}
            result={{
                cards: [
                    { front: "What is a sensor?", back: "An input device." }
                ],
                kind: "flashcards",
                persistable: true,
                title: "Robotics Review"
            }}
        />
    );

    expect(screen.getByText("Robotics Review")).toBeVisible();
    expect(screen.getByRole("button", { name: "Save Deck" })).toBeVisible();
});
