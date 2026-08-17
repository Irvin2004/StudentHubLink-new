import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

const plannerActions = vi.hoisted(() => ({
    clearCompleted: vi.fn().mockResolvedValue(true),
    deleteTask: vi.fn().mockResolvedValue(true),
    startSession: vi.fn()
}));

vi.mock("../studySessions/context/study-session-context.js", () => ({
    useStudySession: () => ({ startSession: plannerActions.startSession })
}));
vi.mock("../studySessions/hooks/useStudySessions.js", () => ({
    useStudySessions: () => ({
        analytics: {
            averageSessionMinutes: 30,
            dailyBreakdown: [
                { date: "2026-08-10", day: "Mon", minutes: 60 },
                { date: "2026-08-11", day: "Tue", minutes: 60 },
                { date: "2026-08-12", day: "Wed", minutes: 0 },
                { date: "2026-08-13", day: "Thu", minutes: 0 },
                { date: "2026-08-14", day: "Fri", minutes: 0 },
                { date: "2026-08-15", day: "Sat", minutes: 0 },
                { date: "2026-08-16", day: "Sun", minutes: 0 }
            ],
            longestSessionMinutes: 45,
            streak: { current: 2, longest: 2, progress: 29 },
            subjectBreakdown: [{ minutes: 120, subject: "Science" }],
            weeklyGoalMinutes: 300,
            weeklyMinutes: 120,
            weeklyProgress: 40
        },
        error: null,
        flashcardDecks: [],
        goalError: null,
        goalUpdating: false,
        loading: false,
        sessions: [],
        setWeeklyGoal: vi.fn(),
        weeklyGoalMinutes: 300,
        weeklyMinutes: 120,
        weeklyProgress: 40
    })
}));

vi.mock("./hooks/useStudyPlanner.js", () => ({
    useStudyPlanner: () => ({
        addTask: vi.fn(),
        activeStudyMinutes: 45,
        clearCompleted: plannerActions.clearCompleted,
        completedTasks: 1,
        deleteTask: plannerActions.deleteTask,
        editTask: vi.fn(),
        error: null,
        loading: false,
        mutationError: null,
        progress: 33,
        tasks: [
            {
                id: "overdue-active",
                title: "Overdue active task",
                subject: "History",
                dueDate: "2026-08-01",
                dueGroup: "overdue",
                estimatedTime: "20 min",
                priority: "High",
                completed: false
            },
            {
                id: "later-completed",
                title: "Later completed task",
                subject: "Science",
                dueDate: "2026-09-10",
                dueGroup: "later",
                estimatedTime: "30 min",
                priority: "Low",
                completed: true
            },
            {
                id: "later-active",
                title: "Later active task",
                subject: "Science",
                dueDate: "2026-09-01",
                dueGroup: "later",
                estimatedTime: "25 min",
                priority: "Medium",
                completed: false
            }
        ],
        toggleTask: vi.fn(),
        todayStudyMinutes: 0,
        totalTasks: 3
    })
}));

import StudyPlannerPage from "./StudyPlannerPage.jsx";

function renderPlanner(route = "/app/study-planner") {
    return render(
        <MemoryRouter initialEntries={[route]}>
            <StudyPlannerPage />
        </MemoryRouter>
    );
}

test("filters tasks, hides empty sections, and sorts each section", () => {
    renderPlanner();

    expect(screen.getByRole("heading", { name: "Overdue (1)" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Later (2)" })).toBeVisible();
    expect(
        screen.queryByRole("heading", { name: "Today" })
    ).not.toBeInTheDocument();

    const laterActive = screen.getByText("Later active task");
    const laterCompleted = screen.getByText("Later completed task");
    expect(
        laterActive.compareDocumentPosition(laterCompleted) &
            Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Completed" }));
    expect(screen.getByText("Later completed task")).toBeVisible();
    expect(screen.queryByText("Overdue active task")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Completed" })).toHaveAttribute(
        "aria-pressed",
        "true"
    );

    fireEvent.click(screen.getByRole("button", { name: "Active" }));
    expect(screen.getByText("Overdue active task")).toBeVisible();
    expect(screen.queryByText("Later completed task")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Search tasks"), {
        target: { value: "history" }
    });
    expect(screen.getByText("Overdue active task")).toBeVisible();
    expect(screen.queryByText("Later active task")).not.toBeInTheDocument();
});

test("confirms a single task deletion", async () => {
    renderPlanner();

    fireEvent.click(
        screen.getByRole("button", { name: "Delete Overdue active task" })
    );
    const dialog = screen.getByRole("dialog");
    expect(
        within(dialog).getByRole("heading", { name: "Delete this task?" })
    ).toBeVisible();
    fireEvent.click(
        within(dialog).getByRole("button", { name: "Delete Task" })
    );

    await vi.waitFor(() =>
        expect(plannerActions.deleteTask).toHaveBeenCalledWith("overdue-active")
    );
});

test("filters by priority and confirms clearing completed tasks", async () => {
    renderPlanner();

    fireEvent.click(screen.getByRole("button", { name: "High" }));
    expect(screen.getByText("Overdue active task")).toBeVisible();
    expect(screen.queryByText("Later active task")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear Completed" }));
    expect(
        screen.getByRole("heading", { name: "Clear completed tasks?" })
    ).toBeVisible();
    fireEvent.click(
        within(screen.getByRole("dialog")).getByRole("button", {
            name: "Clear Completed"
        })
    );

    await vi.waitFor(() =>
        expect(plannerActions.clearCompleted).toHaveBeenCalledOnce()
    );
});

test("highlights and scrolls a deep-linked task into view", async () => {
    const scrollIntoView = vi.fn();
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = scrollIntoView;

    try {
        renderPlanner("/app/study-planner?task=later-active");

        const taskCard = document.getElementById("study-task-later-active");
        await vi.waitFor(() => expect(scrollIntoView).toHaveBeenCalledOnce());
        expect(taskCard).toHaveAttribute("aria-current", "true");
        expect(taskCard).toHaveFocus();
    } finally {
        if (originalScrollIntoView) {
            HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
        } else {
            delete HTMLElement.prototype.scrollIntoView;
        }
    }
});

test("starts a study session from an active planner task", () => {
    renderPlanner();

    fireEvent.click(
        screen.getByRole("button", {
            name: "Start study session for Overdue active task"
        })
    );

    expect(plannerActions.startSession).toHaveBeenCalledWith({
        sourceType: "task",
        subject: "History",
        taskId: "overdue-active",
        title: "Overdue active task"
    });
});
