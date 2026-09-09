import {
    fireEvent,
    render,
    screen,
    waitFor,
    within
} from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import { ROUTES } from "../../config/routes.js";

const navigate = vi.hoisted(() => vi.fn());
const startSession = vi.hoisted(() => vi.fn());
const addStudyTask = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", async (importOriginal) => ({
    ...(await importOriginal()),
    useNavigate: () => navigate
}));
vi.mock("../../hooks/useAuth.js", () => ({
    useAuth: () => ({
        profile: { displayName: "Student" },
        user: { uid: "user-1" }
    })
}));
vi.mock("../studyPlanner/services/study-planner-service.js", () => ({
    addStudyTask
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
            recommendations: [
                {
                    actionLabel: "Retake quiz",
                    evidence: "3 struggle signals · 1 correct",
                    id: "quiz:biology",
                    quizId: "biology-quiz",
                    reason: "Latest score was 55%",
                    studyPlan: {
                        advisoryReason:
                            "Suggested on a lighter planner day with 30 existing minutes.",
                        dueDate: "2026-09-01",
                        estimatedMinutes: 30,
                        notes: "Recommended by Thuto: Latest score was 55%",
                        priority: "High",
                        quizId: "biology-quiz",
                        subject: "Biology",
                        taskType: "quiz",
                        title: "Retake Biology Quiz 2"
                    },
                    subject: "Biology",
                    taskType: "quiz",
                    target: {
                        feature: "quiz",
                        id: "biology-quiz",
                        kind: "route",
                        mode: "take"
                    },
                    title: "Retake Biology Quiz 2"
                },
                {
                    actionLabel: "Open resource",
                    id: "resource:chapter-4",
                    reason: "This topic needs review",
                    target: {
                        feature: "resource",
                        id: "science:chapter-4",
                        kind: "route"
                    },
                    title: "Study Chapter 4 notes"
                },
                {
                    actionLabel: "Start 30 minutes",
                    id: "topic:accounting",
                    reason: "Not studied for 20 days",
                    target: {
                        kind: "start-session",
                        subject: "Accounting",
                        title: "Thuto focus: Accounting"
                    },
                    title: "Spend 30 minutes on Accounting"
                }
            ],
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
    addStudyTask.mockReset();
    addStudyTask.mockResolvedValue({ id: "new-task" });
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

test("opens Thuto from a dashboard action", () => {
    render(<DashboardPage />);

    expect(
        screen.getByRole("region", {
            name: "Thuto — Your Learning Companion"
        })
    ).toHaveTextContent("Hi, I’m Thuto 👋 What would you like to learn today?");
    fireEvent.click(
        screen.getByRole("button", { name: "Summarise with Thuto" })
    );

    expect(
        screen.getByRole("dialog", {
            name: "Thuto — Your Learning Companion"
        })
    ).toBeVisible();
    expect(screen.getByLabelText("Thuto action")).toHaveValue(
        "summarise-notes"
    );
});

test("routes Thuto recommendations to features and study sessions", () => {
    render(<DashboardPage />);
    const recommendations = screen.getByRole("region", {
        name: "Recommended by Thuto"
    });
    expect(recommendations).toHaveTextContent(
        "Learning evidence: 3 struggle signals · 1 correct"
    );

    fireEvent.click(
        within(recommendations).getByRole("button", { name: "Retake quiz" })
    );
    fireEvent.click(
        within(recommendations).getByRole("button", { name: "Open resource" })
    );
    fireEvent.click(
        within(recommendations).getByRole("button", {
            name: "Start 30 minutes"
        })
    );

    expect(navigate).toHaveBeenNthCalledWith(
        1,
        `${ROUTES.QUIZZES}?quiz=biology-quiz&mode=take`
    );
    expect(navigate).toHaveBeenNthCalledWith(
        2,
        `${ROUTES.RESOURCES}?resource=science%3Achapter-4`
    );
    expect(startSession).toHaveBeenCalledWith({
        sourceType: "task",
        subject: "Accounting",
        title: "Thuto focus: Accounting"
    });
});

test("reviews and saves a Thuto recommendation as a linked planner task", async () => {
    render(<DashboardPage />);

    fireEvent.click(screen.getByRole("button", { name: "Add to Study Plan" }));

    const dialog = screen.getByRole("dialog", { name: "Add to Study Plan" });
    expect(dialog).toHaveTextContent("Why this time?");
    expect(within(dialog).getByLabelText(/^Date/)).toHaveValue("2026-09-01");
    expect(within(dialog).getByText("Linked Quiz")).toBeVisible();

    fireEvent.change(within(dialog).getByLabelText(/^Duration \(minutes\)/), {
        target: { value: "45" }
    });
    fireEvent.click(
        within(dialog).getByRole("button", { name: "Add to Study Plan" })
    );

    await waitFor(() =>
        expect(addStudyTask).toHaveBeenCalledWith(
            "user-1",
            expect.objectContaining({
                dueDate: "2026-09-01",
                estimatedMinutes: 45,
                priority: "High",
                quizId: "biology-quiz",
                subject: "Biology",
                taskType: "quiz",
                title: "Retake Biology Quiz 2"
            })
        )
    );
    expect(
        screen.queryByRole("dialog", { name: "Add to Study Plan" })
    ).not.toBeInTheDocument();
});
