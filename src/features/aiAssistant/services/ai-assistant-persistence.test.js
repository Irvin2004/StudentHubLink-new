import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    addStudyTask: vi.fn(),
    createFlashcard: vi.fn(),
    createFlashcardDeck: vi.fn(),
    createQuiz: vi.fn(),
    createQuizQuestion: vi.fn()
}));

vi.mock("../../flashcards/services/flashcard-service.js", () => ({
    createFlashcard: mocks.createFlashcard,
    createFlashcardDeck: mocks.createFlashcardDeck
}));
vi.mock("../../quizzes/services/quiz-service.js", () => ({
    createQuiz: mocks.createQuiz,
    createQuizQuestion: mocks.createQuizQuestion
}));
vi.mock("../../studyPlanner/services/study-planner-service.js", () => ({
    addStudyTask: mocks.addStudyTask
}));

import { saveAIResult } from "./ai-assistant-persistence.js";

beforeEach(() => {
    vi.clearAllMocks();
    mocks.createFlashcardDeck.mockResolvedValue({ id: "deck-1" });
    mocks.createQuiz.mockResolvedValue({ id: "quiz-1" });
    mocks.addStudyTask.mockResolvedValue({ id: "task-1" });
});

test("saves generated flashcards through the flashcard service", async () => {
    const result = await saveAIResult("user-1", {
        cards: [
            { front: "Front 1", back: "Back 1" },
            { front: "Front 2", back: "Back 2" }
        ],
        kind: "flashcards",
        subject: "Robotics",
        title: "Robotics Review"
    });

    expect(mocks.createFlashcardDeck).toHaveBeenCalledOnce();
    expect(mocks.createFlashcard).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ count: 2, id: "deck-1", kind: "flashcards" });
});

test("saves generated quiz questions through the quiz service", async () => {
    const questions = [
        {
            correctOptionIndex: 0,
            options: ["A", "B", "C", "D"],
            position: 0,
            prompt: "Question?"
        }
    ];
    const result = await saveAIResult("user-1", {
        kind: "quiz",
        questions,
        subject: "Robotics",
        title: "Robotics Quiz"
    });

    expect(mocks.createQuizQuestion).toHaveBeenCalledWith(
        "user-1",
        "quiz-1",
        expect.objectContaining({ questionCount: 1 })
    );
    expect(result).toEqual({ count: 1, id: "quiz-1", kind: "quiz" });
});

test("saves every suggested planner task", async () => {
    const tasks = [{ title: "Review" }, { title: "Practise" }];
    await expect(
        saveAIResult("user-1", { kind: "study-plan", tasks })
    ).resolves.toEqual({ count: 2, kind: "study-plan" });
    expect(mocks.addStudyTask).toHaveBeenCalledTimes(2);
});
