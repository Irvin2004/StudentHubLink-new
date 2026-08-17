import { beforeEach, expect, test, vi } from "vitest";

import {
    clearQuizSession,
    createQuizAttemptId,
    loadQuizSession,
    saveQuizSession
} from "./quiz-session-storage.js";

const questions = [{ id: "q1" }, { id: "q2" }];

beforeEach(() => window.sessionStorage.clear());

test("restores an in-progress quiz with its original timer and attempt ID", () => {
    saveQuizSession("quiz-1", {
        answers: { q1: 2 },
        attemptId: "attempt-1",
        practiceWeak: false,
        questionIds: ["q1", "q2"],
        questionIndex: 1,
        startedAt: "2026-08-14T10:00:00.000Z",
        taskId: "task-1"
    });

    expect(loadQuizSession("quiz-1", questions)).toEqual(
        expect.objectContaining({
            attemptId: "attempt-1",
            questionIndex: 1,
            startedAt: "2026-08-14T10:00:00.000Z"
        })
    );
    clearQuizSession("quiz-1");
    expect(loadQuizSession("quiz-1", questions)).toBeNull();
});

test("rejects recovery when the question set or practice mode changed", () => {
    saveQuizSession("quiz-1", {
        answers: {},
        attemptId: "attempt-1",
        practiceWeak: false,
        questionIds: ["q1"],
        questionIndex: 0,
        startedAt: new Date().toISOString()
    });

    expect(loadQuizSession("quiz-1", questions)).toBeNull();
    expect(createQuizAttemptId("quiz-1")).toBeTruthy();
    vi.restoreAllMocks();
});
