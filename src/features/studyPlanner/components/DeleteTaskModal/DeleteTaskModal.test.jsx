import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { DeleteTaskModal } from "./DeleteTaskModal.jsx";

const task = { id: "task-1", title: "Read chapter 2" };

test("starts on the safe action and closes with Escape", async () => {
    const onClose = vi.fn();

    render(
        <DeleteTaskModal
            onClose={onClose}
            onConfirm={vi.fn()}
            open
            task={task}
        />
    );

    await waitFor(() =>
        expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus()
    );
    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledOnce();
});

test("confirms deletion through its form", async () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn().mockResolvedValue(true);

    render(
        <DeleteTaskModal
            onClose={onClose}
            onConfirm={onConfirm}
            open
            task={task}
        />
    );

    fireEvent.submit(screen.getByRole("button", { name: "Delete Task" }).form);

    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith("task-1"));
    expect(onClose).toHaveBeenCalledOnce();
});
