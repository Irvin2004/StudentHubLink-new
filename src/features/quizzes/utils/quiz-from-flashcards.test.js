import { expect, test } from "vitest";

import {
    buildQuizQuestionsFromFlashcards,
    canCreateQuizFromFlashcards
} from "./quiz-from-flashcards.js";

const cards = [
    { id: "c1", front: "CPU", back: "Central Processing Unit" },
    { id: "c2", front: "RAM", back: "Random Access Memory" },
    { id: "c3", front: "SSD", back: "Solid State Drive" },
    { id: "c4", front: "GPU", back: "Graphics Processing Unit" }
];

test("creates linked four-option questions from a flashcard deck", () => {
    const questions = buildQuizQuestionsFromFlashcards(cards);

    expect(canCreateQuizFromFlashcards(cards)).toBe(true);
    expect(questions).toHaveLength(4);
    expect(questions[0]).toEqual(
        expect.objectContaining({
            prompt: "CPU",
            sourceFlashcardId: "c1"
        })
    );
    expect(questions[0].options).toHaveLength(4);
    expect(questions[0].options[questions[0].correctOptionIndex]).toBe(
        "Central Processing Unit"
    );
});

test("requires four distinct answers", () => {
    expect(canCreateQuizFromFlashcards(cards.slice(0, 3))).toBe(false);
    expect(() => buildQuizQuestionsFromFlashcards(cards.slice(0, 3))).toThrow(
        /at least four cards/i
    );
});
