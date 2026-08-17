import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { AddTaskModal } from "./AddTaskModal.jsx";

test("submits a study task from the modal", async () => {
    const onAddTask = vi.fn();
    const onClose = vi.fn();

    render(<AddTaskModal onAddTask={onAddTask} onClose={onClose} open />);

    fireEvent.change(screen.getByLabelText(/^Title/), {
        target: { value: "Review chapter 4" }
    });
    fireEvent.change(screen.getByLabelText(/^Subject/), {
        target: { value: "Mathematics" }
    });
    fireEvent.change(screen.getByLabelText(/^Notes/), {
        target: { value: "Focus on integration by parts." }
    });
    fireEvent.change(screen.getByLabelText(/^Due date/), {
        target: { value: "2026-08-12" }
    });
    fireEvent.change(screen.getByLabelText(/^Estimated time/), {
        target: { value: "45" }
    });
    fireEvent.change(screen.getByLabelText(/^Priority/), {
        target: { value: "High" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Add Task" }));

    expect(onAddTask).toHaveBeenCalledWith({
        title: "Review chapter 4",
        subject: "Mathematics",
        notes: "Focus on integration by parts.",
        dueDate: "2026-08-12",
        estimatedTime: "45",
        priority: "High",
        flashcardDeckId: "",
        taskType: "study"
    });
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
});

test("cancel closes and clears the form", () => {
    const onClose = vi.fn();
    const { rerender } = render(
        <AddTaskModal onAddTask={vi.fn()} onClose={onClose} open />
    );

    fireEvent.change(screen.getByLabelText(/^Title/), {
        target: { value: "Temporary task" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalledOnce();

    rerender(<AddTaskModal onAddTask={vi.fn()} onClose={onClose} open />);
    expect(screen.getByLabelText(/^Title/)).toHaveValue("");
    expect(screen.getByLabelText(/^Priority/)).toHaveValue("Medium");
});

test("populates and submits an existing task in edit mode", async () => {
    const onUpdateTask = vi.fn();
    const onClose = vi.fn();

    render(
        <AddTaskModal
            onClose={onClose}
            onUpdateTask={onUpdateTask}
            open
            task={{
                id: "calculus-review",
                title: "Calculus review",
                subject: "Mathematics",
                notes: "Review practice questions 1-10.",
                dueDate: "2026-08-12",
                estimatedMinutes: 45,
                priority: "Medium"
            }}
        />
    );

    expect(
        screen.getByRole("heading", { name: "Edit Study Task" })
    ).toBeVisible();
    expect(screen.getByLabelText(/^Title/)).toHaveValue("Calculus review");
    expect(screen.getByLabelText(/^Subject/)).toHaveValue("Mathematics");
    expect(screen.getByLabelText(/^Notes/)).toHaveValue(
        "Review practice questions 1-10."
    );
    expect(screen.getByLabelText(/^Due date/)).toHaveValue("2026-08-12");
    expect(screen.getByLabelText(/^Estimated time/)).toHaveValue(45);
    expect(screen.getByLabelText(/^Priority/)).toHaveValue("Medium");

    fireEvent.change(screen.getByLabelText(/^Title/), {
        target: { value: "Calculus final review" }
    });
    fireEvent.change(screen.getByLabelText(/^Priority/), {
        target: { value: "High" }
    });
    fireEvent.change(screen.getByLabelText(/^Notes/), {
        target: { value: "Prioritise past-paper questions." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(onUpdateTask).toHaveBeenCalledWith("calculus-review", {
        title: "Calculus final review",
        subject: "Mathematics",
        notes: "Prioritise past-paper questions.",
        dueDate: "2026-08-12",
        estimatedTime: "45",
        priority: "High",
        flashcardDeckId: "",
        taskType: "study"
    });
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
});

test("focuses the title and closes with Escape", async () => {
    const onClose = vi.fn();

    render(<AddTaskModal onAddTask={vi.fn()} onClose={onClose} open />);

    await waitFor(() => expect(screen.getByLabelText(/^Title/)).toHaveFocus());
    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledOnce();
});

test("links an optional flashcard deck to a flashcard study task", async () => {
    const onAddTask = vi.fn();
    render(
        <AddTaskModal
            decks={[{ dueCount: 3, id: "deck-1", title: "Robotics" }]}
            initialValues={{
                dueDate: "2026-08-12",
                estimatedTime: 30,
                subject: "Robotics",
                taskType: "flashcards",
                title: "Study Robotics"
            }}
            onAddTask={onAddTask}
            onClose={vi.fn()}
            open
        />
    );

    fireEvent.change(screen.getByLabelText(/^Flashcard deck/), {
        target: { value: "deck-1" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Add Task" }));

    await waitFor(() =>
        expect(onAddTask).toHaveBeenCalledWith(
            expect.objectContaining({
                flashcardDeckId: "deck-1",
                taskType: "flashcards"
            })
        )
    );
});
