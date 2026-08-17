import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import { ROUTES } from "../../config/routes.js";

const navigate = vi.hoisted(() => vi.fn());
const startSession = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", async (importOriginal) => ({
    ...(await importOriginal()),
    useNavigate: () => navigate
}));
vi.mock("../../hooks/useAuth.js", () => ({
    useAuth: () => ({ profile: { displayName: "Student" }, user: null })
}));
vi.mock("../studySessions/context/study-session-context.js", () => ({
    useStudySession: () => ({ startSession })
}));
vi.mock("./hooks/useDashboard.js", () => ({
    useDashboard: () => ({
        dashboard: {
            activity: [],
            continueLearning: [
                {
                    lastOpenedLabel: "1h ago",
                    resourceKey: "science:general:notes",
                    subject: "Science",
                    title: "Science notes"
                },
                {
                    id: "quiz-1",
                    lastOpenedLabel: "Today",
                    learningType: "quiz",
                    progress: 80,
                    quizId: "quiz-1",
                    subject: "Programming",
                    title: "Programming Quiz"
                }
            ],
            deadlines: [
                {
                    id: "deadline-task",
                    title: "Deadline task",
                    subject: "Science",
                    due: "Due tomorrow",
                    priority: "Medium"
                }
            ],
            focusTask: {
                id: "focus-task",
                title: "Focus task",
                subject: "Programming",
                due: "Due today",
                estimatedTime: "45m",
                priority: "High"
            },
            greeting: { name: "Student", message: "Welcome" },
            stats: { communities: 8, messages: 12, resources: 42, tasks: 2 },
            studyStreak: { current: 2, longest: 4, progress: 50 },
            weeklyGoalMinutes: 300,
            weeklyMinutes: 150,
            weeklyProgress: 50
        },
        error: null,
        loading: false,
        reload: vi.fn()
    })
}));

import DashboardPage from "./DashboardPage.jsx";

beforeEach(() => {
    navigate.mockClear();
});

test("shows planner metrics and navigates dashboard tasks to the planner", () => {
    render(<DashboardPage />);

    expect(screen.getByRole("heading", { name: "Tasks" })).toBeVisible();
    expect(screen.getByText(/Weekly Goal/)).toBeVisible();
    expect(
        screen.getByRole("progressbar", { name: "Weekly progress 50%" })
    ).toHaveAttribute("aria-valuenow", "50");

    fireEvent.click(screen.getByRole("button", { name: "Open Task" }));
    fireEvent.click(screen.getByRole("button", { name: "Open" }));

    expect(navigate).toHaveBeenNthCalledWith(
        1,
        `${ROUTES.STUDY_PLANNER}?task=focus-task`
    );
    expect(navigate).toHaveBeenNthCalledWith(
        2,
        `${ROUTES.STUDY_PLANNER}?task=deadline-task`
    );
});

test("routes dashboard resource actions through the resource library", () => {
    render(<DashboardPage />);

    fireEvent.click(screen.getByRole("button", { name: "Upload Resource" }));
    fireEvent.click(screen.getByRole("button", { name: "Browse Resources" }));

    expect(navigate).toHaveBeenNthCalledWith(
        1,
        `${ROUTES.RESOURCES}?action=upload`
    );
    expect(navigate).toHaveBeenNthCalledWith(2, ROUTES.RESOURCES);
});

test("deep-links recently opened resources from Continue Learning", () => {
    render(<DashboardPage />);

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(navigate).toHaveBeenCalledWith(
        `${ROUTES.RESOURCES}?resource=science%3Ageneral%3Anotes`
    );
});

test("continues from the Welcome Card to the latest learning item", () => {
    render(<DashboardPage />);

    fireEvent.click(screen.getByRole("button", { name: "Continue Learning" }));

    expect(navigate).toHaveBeenCalledWith(
        `${ROUTES.RESOURCES}?resource=science%3Ageneral%3Anotes`
    );
});

test("opens the last quiz from Continue Learning", () => {
    render(<DashboardPage />);

    fireEvent.click(screen.getByRole("button", { name: "Open Quiz" }));

    expect(navigate).toHaveBeenCalledWith(
        `${ROUTES.QUIZZES}?quiz=quiz-1&mode=take`
    );
});

test("launches sessions from focus and continue learning", () => {
    render(<DashboardPage />);

    fireEvent.click(
        screen.getAllByRole("button", { name: "Start Session" })[0]
    );
    fireEvent.click(
        screen.getAllByRole("button", { name: "Start Session" })[1]
    );

    expect(startSession).toHaveBeenNthCalledWith(1, {
        sourceType: "task",
        subject: "Programming",
        taskId: "focus-task",
        title: "Focus task"
    });
    expect(startSession).toHaveBeenNthCalledWith(2, {
        resourceId: "science:general:notes",
        sourceType: "resource",
        subject: "Science",
        title: "Science notes"
    });
});

test("opens the functional AI assistant from a dashboard action", () => {
    render(<DashboardPage />);

    fireEvent.click(screen.getByRole("button", { name: "Summarise Notes" }));

    expect(
        screen.getByRole("dialog", { name: "AI Study Assistant" })
    ).toBeVisible();
    expect(screen.getByLabelText("Assistant action")).toHaveValue(
        "summarise-notes"
    );
});
