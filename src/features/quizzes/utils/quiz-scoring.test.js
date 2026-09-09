import { expect, test } from "vitest";

import { scoreQuiz } from "./quiz-scoring.js";

test("calculates quiz scores and per-question results", () => {
    const questions = [
        { correctOptionIndex: 0, id: "q1" },
        { correctOptionIndex: 2, id: "q2" },
        { correctOptionIndex: 1, id: "q3" }
    ];

    expect(scoreQuiz(questions, { q1: 0, q2: 1 })).toEqual({
        incorrect: 2,
        percentage: 33,
        results: [
            {
                correct: true,
                correctOptionIndex: 0,
                questionId: "q1",
                selectedOptionIndex: 0
            },
            {
                correct: false,
                correctOptionIndex: 2,
                questionId: "q2",
                selectedOptionIndex: 1
            },
            {
                correct: false,
                correctOptionIndex: 1,
                questionId: "q3",
                selectedOptionIndex: null
            }
        ],
        score: 1,
        total: 3
    });
});

test("handles an empty quiz without dividing by zero", () => {
    expect(scoreQuiz([], {})).toEqual({
        incorrect: 0,
        percentage: 0,
        results: [],
        score: 0,
        total: 0
    });
});
