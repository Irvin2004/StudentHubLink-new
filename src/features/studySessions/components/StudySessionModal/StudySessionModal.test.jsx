import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { StudySessionModal } from "./StudySessionModal.jsx";

const session = {
    subject: "Robotics",
    title: "Robotics Fundamentals"
};

test("supports starting, pausing, resuming, and finishing a session", () => {
    const actions = {
        finish: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
        start: vi.fn()
    };
    const { rerender } = render(
        <StudySessionModal
            elapsedSeconds={0}
            onCancel={vi.fn()}
            onFinish={actions.finish}
            onPause={actions.pause}
            onResume={actions.resume}
            onStart={actions.start}
            session={session}
            status="ready"
        />
    );

    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    expect(actions.start).toHaveBeenCalledOnce();

    rerender(
        <StudySessionModal
            elapsedSeconds={1938}
            onCancel={vi.fn()}
            onFinish={actions.finish}
            onPause={actions.pause}
            onResume={actions.resume}
            onStart={actions.start}
            session={session}
            status="running"
        />
    );
    expect(screen.getByText("00:32:18")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(actions.pause).toHaveBeenCalledOnce();

    rerender(
        <StudySessionModal
            elapsedSeconds={1938}
            onCancel={vi.fn()}
            onFinish={actions.finish}
            onPause={actions.pause}
            onResume={actions.resume}
            onStart={actions.start}
            session={session}
            status="paused"
        />
    );
    fireEvent.click(screen.getByRole("button", { name: "Resume" }));
    fireEvent.click(screen.getByRole("button", { name: "Finish Session" }));
    expect(actions.resume).toHaveBeenCalledOnce();
    expect(actions.finish).toHaveBeenCalledOnce();
});
