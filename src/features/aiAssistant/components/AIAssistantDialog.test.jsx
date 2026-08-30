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
    fireEvent.click(
        screen.getByRole("button", { name: "Summarise with Thuto" })
    );

    expect(onRun).toHaveBeenCalledWith({
        action: AI_ACTIONS.SUMMARISE_NOTES,
        content:
            "Robotics combines sensors, control systems, and actuators to perform useful tasks.",
        question: "",
        source: null,
        subject: "Robotics"
    });
});

test("shows and submits the selected resource as Thuto context", () => {
    const onRun = vi.fn();
    const context = {
        content:
            "Acceleration is the rate at which velocity changes over time.",
        contextKind: "content",
        id: "science:general:file-1",
        subject: "Motion notes",
        title: "Motion notes"
    };
    render(
        <AIAssistantDialog
            {...baseProps}
            action={AI_ACTIONS.ASK_QUESTION}
            context={context}
            onRun={onRun}
        />
    );

    expect(
        screen.getByLabelText("Active Thuto study materials")
    ).toHaveTextContent("Active study materials1 of 3Motion notes");
    expect(screen.getByRole("textbox", { name: "Study context" })).toHaveValue(
        context.content
    );
    fireEvent.change(
        screen.getByRole("textbox", {
            name: "Question about this resource"
        }),
        { target: { value: "What is acceleration?" } }
    );
    fireEvent.click(screen.getByRole("button", { name: "Ask a Question" }));

    expect(onRun).toHaveBeenCalledWith({
        action: AI_ACTIONS.ASK_QUESTION,
        content: context.content,
        question: "What is acceleration?",
        source: context,
        subject: "Motion notes"
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

test("restores the resource conversation and starts a new thread", () => {
    const onNewConversation = vi.fn();
    render(
        <AIAssistantDialog
            {...baseProps}
            context={{
                content: "Velocity describes speed in a direction.",
                id: "science:general:file-1",
                title: "Motion notes"
            }}
            conversationMessages={[
                {
                    content: "Explain velocity.",
                    createdAt: new Date("2026-08-29T08:00:00Z"),
                    id: "message-1",
                    role: "user"
                },
                {
                    content: "Velocity is speed with a direction.",
                    createdAt: new Date("2026-08-29T08:01:00Z"),
                    id: "message-2",
                    role: "assistant"
                }
            ]}
            onNewConversation={onNewConversation}
        />
    );

    expect(
        screen.getByRole("region", {
            name: "Conversation about Motion notes"
        })
    ).toHaveTextContent("Explain velocity.");
    expect(
        screen.getByText("Velocity is speed with a direction.")
    ).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "New conversation" }));
    expect(onNewConversation).toHaveBeenCalledOnce();
});

test("shows removable active-material chips and enforces the material cap", () => {
    const onRemoveStudyMaterial = vi.fn();
    const resources = ["Motion notes", "Algebra sheet", "Formula guide"].map(
        (title, index) => ({
            content: `${title} contains study content for the current session.`,
            id: `resource-${index}`,
            title
        })
    );
    render(
        <AIAssistantDialog
            {...baseProps}
            availableStudyMaterials={[
                { id: "resource-4", title: "Extra material" }
            ]}
            context={{
                content: resources
                    .map((resource) => resource.content)
                    .join("\n"),
                id: "set:three",
                resources,
                subject: "Three resources",
                title: "3 study materials"
            }}
            maxStudyMaterials={3}
            onAddStudyMaterial={vi.fn()}
            onRemoveStudyMaterial={onRemoveStudyMaterial}
        />
    );

    expect(
        screen.getByRole("button", { name: "Add study material" })
    ).toBeDisabled();
    expect(screen.getByText("3 material limit reached")).toBeVisible();
    fireEvent.click(
        screen.getByRole("button", { name: "Remove Algebra sheet" })
    );
    expect(onRemoveStudyMaterial).toHaveBeenCalledWith("resource-1");
});

test("shows evidence-backed learning memory notices", () => {
    render(
        <AIAssistantDialog
            {...baseProps}
            context={{
                content: "Acceleration changes velocity over time.",
                id: "motion",
                subject: "Motion",
                title: "Motion"
            }}
            learningMemory={{
                notices: [
                    "You struggled with acceleration last time.",
                    "Your latest Motion quiz result was 55%, so this may need another review."
                ]
            }}
        />
    );

    const memory = screen.getByLabelText("Thuto learning memory");
    expect(memory).toHaveTextContent("What Thuto remembers");
    expect(memory).toHaveTextContent(
        "You struggled with acceleration last time."
    );
    expect(memory).toHaveTextContent("quiz result was 55%");
});
