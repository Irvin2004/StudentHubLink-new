import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import QuestionFormModal from "./QuestionFormModal.jsx";

test("creates a tagged question with an optional linked resource", async () => {
    const onSave = vi.fn().mockResolvedValue();

    render(
        <QuestionFormModal
            initialQuestion={null}
            onClose={vi.fn()}
            onSave={onSave}
            open
            resources={[{ id: "file-1", title: "Calculus notes" }]}
        />
    );

    fireEvent.change(screen.getByLabelText(/^Question title/), {
        target: { value: "Why does this limit exist?" }
    });
    fireEvent.change(screen.getByLabelText(/^Description/), {
        target: { value: "I need help with the last step of the proof." }
    });
    fireEvent.change(screen.getByLabelText(/^Subject or topic tags/), {
        target: { value: "calculus, limits" }
    });
    fireEvent.change(screen.getByLabelText("Linked resource (optional)"), {
        target: { value: "file-1" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Post question" }));

    await waitFor(() =>
        expect(onSave).toHaveBeenCalledWith({
            description: "I need help with the last step of the proof.",
            linkedResource: { id: "file-1", title: "Calculus notes" },
            tags: ["calculus", " limits"],
            title: "Why does this limit exist?"
        })
    );
});

test("reuses canonical topic tags created by trusted community members", () => {
    render(
        <QuestionFormModal
            initialQuestion={null}
            onClose={vi.fn()}
            onSave={vi.fn()}
            open
            resources={[]}
            suggestedTags={[{ id: "calculus", label: "calculus" }]}
        />
    );

    fireEvent.click(screen.getByRole("button", { name: "+ calculus" }));

    expect(screen.getByLabelText(/^Subject or topic tags/)).toHaveValue(
        "calculus"
    );
});
