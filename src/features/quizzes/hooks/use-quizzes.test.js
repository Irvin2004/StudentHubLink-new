import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

const quizService = vi.hoisted(() => ({
    createQuiz: vi.fn(),
    createQuizQuestion: vi.fn(),
    deleteQuiz: vi.fn(),
    deleteQuizQuestion: vi.fn(),
    getQuizLibraryData: vi.fn(),
    getQuizQuestions: vi.fn(),
    saveQuizAttempt: vi.fn(),
    updateQuizQuestion: vi.fn()
}));
const sessions = vi.hoisted(() => ({ completeStudySession: vi.fn() }));

vi.mock("../../../hooks/useAuth.js", () => ({
    useAuth: () => ({ user: { uid: "user-1" } })
}));
vi.mock("../services/quiz-service.js", () => quizService);
vi.mock(
    "../../studySessions/services/study-session-service.js",
    () => sessions
);

import { useQuizzes } from "./useQuizzes.js";

beforeEach(() => {
    vi.clearAllMocks();
    quizService.getQuizLibraryData.mockResolvedValue([
        {
            attempts: [],
            id: "quiz-1",
            subject: "Programming",
            title: "Programming Quiz",
            updatedAt: new Date()
        }
    ]);
    quizService.getQuizQuestions.mockResolvedValue([]);
    quizService.saveQuizAttempt.mockResolvedValue({
        completedAt: new Date(),
        id: "attempt-1",
        percentage: 80
    });
    sessions.completeStudySession.mockResolvedValue({ id: "quiz-attempt-1" });
});

test("records one stable study activity for a planner-linked quiz attempt", async () => {
    const { result } = renderHook(() => useQuizzes());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.selectQuiz("quiz-1"));
    await waitFor(() => expect(result.current.selectedQuiz?.id).toBe("quiz-1"));

    await act(() =>
        result.current.recordAttempt({
            answers: [{ correct: true, questionId: "q1" }],
            attemptId: "attempt-1",
            durationSeconds: 120,
            percentage: 100,
            score: 1,
            startedAt: new Date("2026-08-14T10:00:00.000Z"),
            taskId: "task-1",
            totalQuestions: 1
        })
    );

    expect(quizService.saveQuizAttempt).toHaveBeenCalledTimes(1);
    expect(sessions.completeStudySession).toHaveBeenCalledTimes(1);
    expect(sessions.completeStudySession).toHaveBeenCalledWith(
        "user-1",
        expect.objectContaining({
            quizId: "quiz-1",
            sessionId: "quiz-attempt-1",
            sourceType: "quiz",
            taskId: "task-1"
        })
    );
});
