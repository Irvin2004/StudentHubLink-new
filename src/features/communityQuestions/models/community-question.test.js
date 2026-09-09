import { describe, expect, test } from "vitest";

import {
    normalizeQuestionTags,
    QUESTION_STATUS,
    validateAnswerContent,
    validateCommentContent,
    validateQuestionInput
} from "./community-question.js";

describe("community question model", () => {
    test("normalizes a complete question and optional resource", () => {
        expect(
            validateQuestionInput({
                description: "I do not understand the final substitution.",
                linkedResource: {
                    id: "community:general:file-1",
                    title: "Limits notes"
                },
                tags: [" Calculus ", "limits", "calculus"],
                title: "How does the epsilon-delta proof work?"
            })
        ).toEqual({
            description: "I do not understand the final substitution.",
            linkedResource: {
                id: "community:general:file-1",
                title: "Limits notes"
            },
            tags: ["calculus", "limits"],
            title: "How does the epsilon-delta proof work?"
        });
    });

    test("enforces question, answer, comment, and tag limits", () => {
        expect(() =>
            validateQuestionInput({
                title: "",
                description: "Detail",
                tags: ["math"]
            })
        ).toThrow("Question title is required");
        expect(() =>
            normalizeQuestionTags(["1", "2", "3", "4", "5", "6"])
        ).toThrow("no more than 5");
        expect(() => validateAnswerContent(" ")).toThrow("Answer is required");
        expect(() => validateCommentContent("x".repeat(1001))).toThrow("1000");
    });

    test("exposes the three workflow states", () => {
        expect(QUESTION_STATUS).toEqual({
            ANSWERED: "answered",
            SOLVED: "solved",
            UNANSWERED: "unanswered"
        });
    });
});
