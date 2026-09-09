import { expect, test } from "vitest";

import {
    getQuizDashboardData,
    getQuizStats,
    selectRecentlyTakenQuizzes,
    selectWeakQuestions
} from "./quiz-selectors.js";

const attempts = [
    {
        answers: [
            { correct: false, questionId: "q1" },
            { correct: true, questionId: "q2" }
        ],
        completedAt: new Date("2026-08-12"),
        percentage: 50
    },
    {
        answers: [
            { correct: false, questionId: "q1" },
            { correct: false, questionId: "q2" }
        ],
        completedAt: { toDate: () => new Date("2026-08-14") },
        percentage: 25
    }
];

test("derives attempt, best, latest, and average quiz stats", () => {
    expect(getQuizStats(attempts)).toEqual({
        attempts: 2,
        averageScore: 38,
        bestScore: 50,
        latestCompletedAt: attempts[1].completedAt,
        latestScore: 25
    });
});

test("sorts recently taken quizzes and composes dashboard quiz data", () => {
    const quizzes = [
        { attempts: [attempts[0]], id: "older", subject: "Robotics" },
        { attempts: [attempts[1]], id: "latest", subject: "Programming" }
    ];
    expect(selectRecentlyTakenQuizzes(quizzes).map((quiz) => quiz.id)).toEqual([
        "latest",
        "older"
    ]);
    expect(getQuizDashboardData(quizzes)).toEqual(
        expect.objectContaining({ recentQuizScore: 25, weakTopicCount: 2 })
    );
});

test("ranks current weak questions by repeated incorrect answers", () => {
    const questions = [
        { id: "q1", position: 0, prompt: "CPU?" },
        { id: "q2", position: 1, prompt: "Loop?" },
        { id: "q3", position: 2, prompt: "Correct every time" }
    ];
    expect(selectWeakQuestions(questions, attempts)).toEqual([
        expect.objectContaining({ id: "q1", incorrectCount: 2 }),
        expect.objectContaining({ id: "q2", incorrectCount: 1 })
    ]);
});
