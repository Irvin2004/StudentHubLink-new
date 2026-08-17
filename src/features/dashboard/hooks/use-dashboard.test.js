import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

const services = vi.hoisted(() => ({
    getDashboard: vi.fn(),
    getFlashcardDecks: vi.fn(),
    getQuizLibraryData: vi.fn(),
    getResourceLibraryData: vi.fn(),
    getStudyPreferences: vi.fn(),
    getStudySessions: vi.fn(),
    getStudyPlanner: vi.fn()
}));

vi.mock("../../../hooks/useAuth.js", () => ({
    useAuth: () => ({ user: { uid: "user-1" } })
}));
vi.mock("../../studyPlanner/services/study-planner-service.js", () => ({
    getStudyPlanner: services.getStudyPlanner
}));
vi.mock("../../flashcards/services/flashcard-service.js", () => ({
    getFlashcardDecks: services.getFlashcardDecks
}));
vi.mock("../../quizzes/services/quiz-service.js", () => ({
    getQuizLibraryData: services.getQuizLibraryData
}));
vi.mock("../../../services/file-service.js", () => ({
    getResourceLibraryData: services.getResourceLibraryData
}));
vi.mock("../../studySessions/services/study-session-service.js", () => ({
    getStudyPreferences: services.getStudyPreferences,
    getStudySessions: services.getStudySessions
}));
vi.mock("../services/dashboard-service.js", () => ({
    getDashboard: services.getDashboard
}));

import { useDashboard } from "./useDashboard.js";

beforeEach(() => {
    vi.clearAllMocks();
    services.getDashboard.mockResolvedValue({
        greeting: { name: "Student", message: "Welcome" },
        stats: { communities: 8, messages: 12 }
    });
    services.getStudyPlanner.mockResolvedValue({
        tasks: [
            {
                id: "active-task",
                title: "Active task",
                subject: "Programming",
                dueDate: "2026-08-10",
                estimatedMinutes: 45,
                priority: "High",
                completed: false
            },
            {
                id: "completed-task",
                title: "Completed task",
                subject: "Science",
                dueDate: "2026-08-09",
                estimatedMinutes: 30,
                priority: "Low",
                completed: true
            }
        ]
    });
    services.getResourceLibraryData.mockResolvedValue({
        favorites: { "science:general:recent": "favorite-1" },
        resources: [
            {
                communityName: "Science",
                lastOpened: new Date(),
                resourceKey: "science:general:recent",
                title: "Recent notes"
            },
            {
                communityName: "Maths",
                lastOpened: null,
                resourceKey: "maths:general:new",
                title: "New worksheet"
            }
        ]
    });
    services.getStudySessions.mockResolvedValue([
        {
            id: "session-1",
            actualMinutes: 60,
            completedAt: new Date()
        }
    ]);
    services.getStudyPreferences.mockResolvedValue({
        weeklyGoalMinutes: 480
    });
    services.getFlashcardDecks.mockResolvedValue([]);
    services.getQuizLibraryData.mockResolvedValue([]);
});

test("loads planner tasks through the shared service and composes dashboard data", async () => {
    const { result } = renderHook(() => useDashboard());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(services.getDashboard).toHaveBeenCalledWith("user-1");
    expect(services.getStudyPlanner).toHaveBeenCalledWith("user-1");
    expect(services.getResourceLibraryData).toHaveBeenCalledWith("user-1");
    expect(services.getStudySessions).toHaveBeenCalledWith("user-1");
    expect(services.getStudyPreferences).toHaveBeenCalledWith("user-1");
    expect(services.getFlashcardDecks).toHaveBeenCalledWith("user-1");
    expect(services.getQuizLibraryData).toHaveBeenCalledWith("user-1");
    expect(result.current.dashboard.focusTask.id).toBe("active-task");
    expect(result.current.dashboard.deadlines).toHaveLength(1);
    expect(result.current.dashboard.stats.tasks).toBe(1);
    expect(result.current.dashboard.stats.resources).toBe(2);
    expect(result.current.dashboard.stats.dueFlashcards).toBe(0);
    expect(result.current.dashboard.continueLearning).toHaveLength(1);
    expect(result.current.dashboard.favoriteResources).toHaveLength(1);
    expect(result.current.dashboard.weeklyMinutes).toBe(60);
    expect(result.current.dashboard.weeklyProgress).toBe(13);
    expect(result.current.dashboard.weeklyGoalMinutes).toBe(480);
    expect(result.current.dashboard.studyStreak.current).toBe(1);
});

test("reloads planner data when the dashboard is revisited", async () => {
    const firstVisit = renderHook(() => useDashboard());
    await waitFor(() => expect(firstVisit.result.current.loading).toBe(false));
    expect(firstVisit.result.current.dashboard.stats.tasks).toBe(1);
    firstVisit.unmount();

    services.getStudyPlanner.mockResolvedValueOnce({
        tasks: [
            {
                id: "new-active-task",
                title: "New active task",
                subject: "Mathematics",
                dueDate: "2026-08-11",
                estimatedMinutes: 60,
                priority: "High",
                completed: false
            },
            {
                id: "second-active-task",
                title: "Second active task",
                subject: "Science",
                dueDate: "2026-08-12",
                estimatedMinutes: 30,
                priority: "Medium",
                completed: false
            }
        ]
    });

    const secondVisit = renderHook(() => useDashboard());
    expect(secondVisit.result.current.loading).toBe(true);
    await waitFor(() => expect(secondVisit.result.current.loading).toBe(false));

    expect(services.getStudyPlanner).toHaveBeenCalledTimes(2);
    expect(secondVisit.result.current.dashboard.stats.tasks).toBe(2);
    expect(secondVisit.result.current.dashboard.focusTask.id).toBe(
        "new-active-task"
    );
    expect(secondVisit.result.current.dashboard.weeklyProgress).toBe(13);
});

test("uses recent flashcard decks and due review data when the planner is clear", async () => {
    services.getStudyPlanner.mockResolvedValue({ tasks: [] });
    services.getResourceLibraryData.mockResolvedValue({
        favorites: {},
        resources: []
    });
    services.getFlashcardDecks.mockResolvedValue([
        {
            dueCount: 5,
            id: "deck-1",
            lastStudiedAt: new Date(),
            subject: "Robotics",
            title: "Robot basics"
        }
    ]);

    const { result } = renderHook(() => useDashboard());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.dashboard.stats.dueFlashcards).toBe(5);
    expect(result.current.dashboard.focusTask).toEqual(
        expect.objectContaining({
            flashcardDeckId: "deck-1",
            type: "flashcards"
        })
    );
    expect(result.current.dashboard.continueLearning[0]).toEqual(
        expect.objectContaining({
            deckId: "deck-1",
            learningType: "flashcard"
        })
    );
});

test("refreshes recent decks and due counts after a flashcard session", async () => {
    const { result } = renderHook(() => useDashboard());
    await waitFor(() => expect(result.current.loading).toBe(false));

    services.getFlashcardDecks.mockResolvedValueOnce([
        {
            dueCount: 2,
            id: "deck-refreshed",
            lastStudiedAt: new Date(),
            subject: "Science",
            title: "Refreshed deck"
        }
    ]);
    window.dispatchEvent(new Event("flashcards-updated"));

    await waitFor(() =>
        expect(result.current.dashboard.stats.dueFlashcards).toBe(2)
    );
    expect(result.current.dashboard.continueLearning[0].deckId).toBe(
        "deck-refreshed"
    );
});

test("derives recent quiz and weak-topic dashboard data", async () => {
    services.getQuizLibraryData.mockResolvedValue([
        {
            attempts: [
                {
                    answers: [{ correct: false, questionId: "question-1" }],
                    completedAt: new Date(),
                    percentage: 80
                }
            ],
            id: "quiz-1",
            subject: "Programming",
            title: "Programming Quiz"
        }
    ]);
    const { result } = renderHook(() => useDashboard());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.dashboard.stats.recentQuizScore).toBe(80);
    expect(result.current.dashboard.stats.weakQuizTopics).toBe(1);
    expect(result.current.dashboard.continueLearning).toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                learningType: "quiz",
                quizId: "quiz-1"
            })
        ])
    );
});

test("refreshes quiz insights after an attempt completes", async () => {
    const { result } = renderHook(() => useDashboard());
    await waitFor(() => expect(result.current.loading).toBe(false));
    services.getQuizLibraryData.mockResolvedValueOnce([
        {
            attempts: [
                {
                    answers: [],
                    completedAt: new Date(),
                    percentage: 90
                }
            ],
            id: "quiz-new",
            subject: "Science",
            title: "Science Quiz"
        }
    ]);
    window.dispatchEvent(new Event("quiz-attempt-completed"));
    await waitFor(() =>
        expect(result.current.dashboard.stats.recentQuizScore).toBe(90)
    );
});
