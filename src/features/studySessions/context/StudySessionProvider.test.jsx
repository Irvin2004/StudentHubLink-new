import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    completeStudySession: vi.fn(),
    showToast: vi.fn()
}));

vi.mock("../../../hooks/useAuth.js", () => ({
    useAuth: () => ({ user: { uid: "user-1" } })
}));
vi.mock("../../../hooks/useToast.js", () => ({
    useToast: () => ({ showToast: mocks.showToast })
}));
vi.mock("../services/study-session-service.js", () => ({
    completeStudySession: mocks.completeStudySession
}));

import {
    clearActiveStudySession,
    writeActiveStudySession
} from "../utils/active-session-storage.js";
import { useStudySession } from "./study-session-context.js";
import { StudySessionProvider } from "./StudySessionProvider.jsx";

function Launcher() {
    const { startSession } = useStudySession();
    return (
        <>
            <button
                onClick={() =>
                    startSession({
                        sourceType: "task",
                        subject: "Robotics",
                        taskId: "task-1",
                        title: "First task"
                    })
                }
                type="button"
            >
                Launch first
            </button>
            <button
                onClick={() =>
                    startSession({
                        sourceType: "resource",
                        subject: "Programming",
                        resourceId: "resource-1",
                        title: "Second resource"
                    })
                }
                type="button"
            >
                Launch second
            </button>
        </>
    );
}

beforeEach(() => {
    vi.clearAllMocks();
    const values = new Map();
    Object.defineProperty(window, "localStorage", {
        configurable: true,
        value: {
            clear: () => values.clear(),
            getItem: (key) => values.get(key) ?? null,
            removeItem: (key) => values.delete(key),
            setItem: (key, value) => values.set(key, String(value))
        }
    });
    clearActiveStudySession("user-1");
});

afterEach(() => {
    vi.useRealTimers();
    clearActiveStudySession("user-1");
});

test("recovers a running session and calculates elapsed time from timestamps", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-10T10:05:00"));
    writeActiveStudySession("user-1", {
        accumulatedSeconds: 30,
        runStartedAt: Date.now() - 90_000,
        session: {
            sourceType: "task",
            startedAt: new Date("2026-08-10T10:02:30"),
            subject: "Robotics",
            taskId: "task-1",
            title: "Recovered task"
        },
        status: "running"
    });

    render(
        <StudySessionProvider>
            <Launcher />
        </StudySessionProvider>
    );
    await act(async () => Promise.resolve());

    expect(screen.getByText("Recovered task")).toBeVisible();
    expect(screen.getByText("00:02:00")).toBeVisible();

    act(() => vi.advanceTimersByTime(5_000));
    expect(screen.getByText("00:02:05")).toBeVisible();
});

test("prevents a second active study session from replacing the first", () => {
    render(
        <StudySessionProvider>
            <Launcher />
        </StudySessionProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Launch first" }));
    fireEvent.click(screen.getByRole("button", { name: "Launch second" }));

    expect(screen.getByText("First task")).toBeVisible();
    expect(screen.queryByText("Second resource")).not.toBeInTheDocument();
    expect(mocks.showToast).toHaveBeenCalledWith({
        message: "Finish or cancel your current study session first.",
        type: "warning"
    });
});

test("discards sessions shorter than one minute", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-10T10:00:00"));
    render(
        <StudySessionProvider>
            <Launcher />
        </StudySessionProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Launch first" }));
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    act(() => vi.advanceTimersByTime(5_000));
    fireEvent.click(screen.getByRole("button", { name: "Finish Session" }));

    expect(mocks.completeStudySession).not.toHaveBeenCalled();
    expect(screen.queryByText("First task")).not.toBeInTheDocument();
    expect(mocks.showToast).toHaveBeenCalledWith({
        message: "Sessions under one minute are not saved or counted.",
        type: "warning"
    });
});
