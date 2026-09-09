import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    addStudyTasks: vi.fn(),
    createFlashcardDeckWithCards: vi.fn(),
    createQuizWithQuestions: vi.fn()
}));

vi.mock("../../flashcards/services/flashcard-service.js", () => ({
    createFlashcardDeckWithCards: mocks.createFlashcardDeckWithCards
}));
vi.mock("../../quizzes/services/quiz-service.js", () => ({
    createQuizWithQuestions: mocks.createQuizWithQuestions
}));
vi.mock("../../studyPlanner/services/study-planner-service.js", () => ({
    addStudyTasks: mocks.addStudyTasks
}));

import { saveAIResult } from "./ai-assistant-persistence.js";

beforeEach(() => {
    vi.clearAllMocks();
    mocks.createFlashcardDeckWithCards.mockResolvedValue({ id: "deck-1" });
    mocks.createQuizWithQuestions.mockResolvedValue({ id: "quiz-1" });
    mocks.addStudyTasks.mockImplementation(async (_userId, tasks) => tasks);
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

    expect(mocks.createFlashcardDeckWithCards).toHaveBeenCalledOnce();
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

    expect(mocks.createQuizWithQuestions).toHaveBeenCalledWith(
        "user-1",
        expect.objectContaining({ questions })
    );
    expect(result).toEqual({ count: 1, id: "quiz-1", kind: "quiz" });
});

test("saves every suggested planner task", async () => {
    const tasks = [
        { resourceId: "science:general:file-1", title: "Review" },
        { resourceId: "science:general:file-1", title: "Practise" }
    ];
    await expect(
        saveAIResult("user-1", {
            kind: "study-plan",
            resourceId: "science:general:file-1",
            tasks
        })
    ).resolves.toEqual({ count: 2, kind: "study-plan" });
    expect(mocks.addStudyTasks).toHaveBeenCalledOnce();
    expect(mocks.addStudyTasks).toHaveBeenCalledWith(
        "user-1",
        expect.arrayContaining([
            expect.objectContaining({
                resourceId: "science:general:file-1"
            })
        ])
    );
});

test.each(["quiz", "flashcards"])(
    "does not announce a failed %s save and allows retry",
    async (kind) => {
        const save =
            kind === "quiz"
                ? mocks.createQuizWithQuestions
                : mocks.createFlashcardDeckWithCards;
        const event = vi.spyOn(window, "dispatchEvent");
        const input = { kind, questions: [{}], cards: [{}] };
        save.mockRejectedValueOnce(new Error("write rejected"));
        await expect(saveAIResult("user-1", input)).rejects.toThrow(
            "write rejected"
        );
        expect(event).not.toHaveBeenCalled();
        await saveAIResult("user-1", input);
        expect(event).toHaveBeenCalledOnce();
        event.mockRestore();
    }
);
