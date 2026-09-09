import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import KnowledgeCollectionFormModal from "./KnowledgeCollectionFormModal.jsx";

test("creates an ordered collection from existing study materials", async () => {
    const onSave = vi.fn().mockResolvedValue();
    const candidates = [
        {
            id: "resource:file-1",
            sourceId: "file-1",
            sourceType: "resource",
            title: "Limits notes"
        },
        {
            id: "quiz:quiz-1",
            sourceId: "quiz-1",
            sourceType: "quiz",
            title: "Limits practice"
        }
    ];
    render(
        <KnowledgeCollectionFormModal
            candidates={candidates}
            initialCollection={null}
            onClose={vi.fn()}
            onSave={onSave}
            open
        />
    );

    fireEvent.change(screen.getByLabelText(/^Collection title/), {
        target: { value: "Calculus Exam Prep" }
    });
    fireEvent.change(screen.getByLabelText(/^Description/), {
        target: { value: "A focused exam study path." }
    });
    fireEvent.change(screen.getByLabelText(/^Subject or topic tags/), {
        target: { value: "calculus, limits" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Add item" }));
    fireEvent.change(screen.getByLabelText("Existing study material"), {
        target: { value: "quiz:quiz-1" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Add item" }));
    fireEvent.click(
        screen.getByRole("button", { name: "Move Limits practice up" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Create collection" }));

    await waitFor(() =>
        expect(onSave).toHaveBeenCalledWith({
            description: "A focused exam study path.",
            items: [candidates[1], candidates[0]],
            tags: ["calculus", " limits"],
            title: "Calculus Exam Prep"
        })
    );
});
