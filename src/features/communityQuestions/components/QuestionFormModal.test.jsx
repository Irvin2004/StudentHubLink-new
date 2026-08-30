import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";

import QuestionFormModal from "./QuestionFormModal.jsx";

test("creates a tagged question with an optional linked resource", async () => {
    const user = userEvent.setup();
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

    await user.type(
        screen.getByLabelText(/^Question title/),
        "Why does this limit exist?"
    );
    await user.type(
        screen.getByLabelText(/^Description/),
        "I need help with the last step of the proof."
    );
    await user.type(
        screen.getByLabelText(/^Subject or topic tags/),
        "calculus, limits"
    );
    await user.selectOptions(
        screen.getByLabelText("Linked resource (optional)"),
        "file-1"
    );
    await user.click(screen.getByRole("button", { name: "Post question" }));

    expect(onSave).toHaveBeenCalledWith({
        description: "I need help with the last step of the proof.",
        linkedResource: { id: "file-1", title: "Calculus notes" },
        tags: ["calculus", " limits"],
        title: "Why does this limit exist?"
    });
});
