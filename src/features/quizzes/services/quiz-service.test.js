import { beforeEach, expect, test, vi } from "vitest";

const firestore = vi.hoisted(() => ({
    batches: [],
    collection: vi.fn((...parts) => ({
        path: parts
            .slice(parts[0] === "db" ? 1 : 0)
            .map((part) => part.path || part)
            .join("/")
    })),
    doc: vi.fn((parent, id = "generated-id") => ({
        id,
        path: `${parent.path}/${id}`
    })),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    limit: vi.fn((value) => ["limit", value]),
    orderBy: vi.fn((...parts) => parts),
    query: vi.fn((reference) => reference),
    serverTimestamp: vi.fn(() => "server-time"),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    writeBatch: vi.fn(() => {
        const batch = {
            commit: vi.fn().mockResolvedValue(undefined),
            delete: vi.fn(),
            set: vi.fn(),
            update: vi.fn()
        };
        firestore.batches.push(batch);
        return batch;
    })
}));

vi.mock("firebase/firestore", () => firestore);
vi.mock("../../../firebase/index.js", () => ({ db: "db" }));

import {
    createQuiz,
    createQuizFromFlashcardDeck,
    createQuizQuestion,
    deleteQuiz,
    getQuizAttempts,
    getQuizQuestions,
    getQuizzes,
    saveQuizAttempt,
    updateQuizQuestion
} from "./quiz-service.js";

beforeEach(() => {
    vi.clearAllMocks();
    firestore.batches.length = 0;
    firestore.getDoc.mockResolvedValue({ exists: () => false });
});

test("creates and loads quizzes and ordered questions", async () => {
    await createQuiz("user-1", {
        subject: " Programming ",
        title: " CPU Quiz "
    });
    expect(firestore.setDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: "generated-id" }),
        expect.objectContaining({
            questionCount: 0,
            subject: "Programming",
            title: "CPU Quiz"
        })
    );

    firestore.getDocs.mockResolvedValueOnce({
        docs: [{ data: () => ({ title: "CPU Quiz" }), id: "quiz-1" }]
    });
    await expect(getQuizzes("user-1")).resolves.toEqual([
        { id: "quiz-1", title: "CPU Quiz" }
    ]);

    firestore.getDocs.mockResolvedValueOnce({
        docs: [{ data: () => ({ prompt: "Question" }), id: "question-1" }]
    });
    await expect(getQuizQuestions("user-1", "quiz-1")).resolves.toEqual([
        { id: "question-1", prompt: "Question" }
    ]);
});

test("creates and edits four-option questions atomically", async () => {
    const question = {
        correctOptionIndex: 0,
        options: [" A ", "B", "C", "D"],
        position: 0,
        prompt: " CPU? ",
        questionCount: 1
    };
    await createQuizQuestion("user-1", "quiz-1", question);
    await updateQuizQuestion("user-1", "quiz-1", "question-1", question);

    expect(firestore.batches[0].set).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
            options: ["A", "B", "C", "D"],
            prompt: "CPU?"
        })
    );
    expect(firestore.batches[0].update).toHaveBeenCalledWith(
        expect.objectContaining({ id: "quiz-1" }),
        expect.objectContaining({ questionCount: 1 })
    );
    expect(firestore.batches[1].update).toHaveBeenCalledWith(
        expect.objectContaining({ id: "question-1" }),
        expect.objectContaining({ correctOptionIndex: 0 })
    );
});

test("creates a quiz linked to its source flashcard deck", async () => {
    await createQuizFromFlashcardDeck(
        "user-1",
        { id: "deck-1", subject: "Robotics", title: "Control Systems" },
        [
            {
                correctOptionIndex: 0,
                options: ["A", "B", "C", "D"],
                position: 0,
                prompt: "PID?",
                sourceFlashcardId: "card-1"
            }
        ]
    );

    expect(firestore.batches[0].set).toHaveBeenCalledWith(
        expect.objectContaining({ id: "generated-id" }),
        expect.objectContaining({
            flashcardDeckId: "deck-1",
            questionCount: 1,
            title: "Control Systems Quiz"
        })
    );
    expect(firestore.batches[0].set).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ sourceFlashcardId: "card-1" })
    );
});

test("saves attempts with answer review data", async () => {
    await saveQuizAttempt("user-1", "quiz-1", {
        answers: [{ correct: true, questionId: "q1" }],
        attemptId: "attempt-1",
        percentage: 100,
        score: 1,
        totalQuestions: 1
    });
    expect(firestore.setDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: "attempt-1" }),
        expect.objectContaining({
            completedAt: "server-time",
            percentage: 100,
            quizId: "quiz-1",
            score: 1,
            totalQuestions: 1
        })
    );
});

test("returns an existing recovered attempt instead of writing it twice", async () => {
    firestore.getDoc.mockResolvedValueOnce({
        data: () => ({ percentage: 100, score: 1 }),
        exists: () => true
    });

    await expect(
        saveQuizAttempt("user-1", "quiz-1", {
            answers: [{ correct: true, questionId: "q1" }],
            attemptId: "attempt-1",
            percentage: 100,
            score: 1,
            totalQuestions: 1
        })
    ).resolves.toEqual({ id: "attempt-1", percentage: 100, score: 1 });
    expect(firestore.setDoc).not.toHaveBeenCalled();
});

test("loads attempts newest first", async () => {
    firestore.getDocs.mockResolvedValueOnce({
        docs: [{ data: () => ({ percentage: 80 }), id: "attempt-1" }]
    });
    await expect(getQuizAttempts("user-1", "quiz-1")).resolves.toEqual([
        { id: "attempt-1", percentage: 80 }
    ]);
    expect(firestore.orderBy).toHaveBeenCalledWith("completedAt", "desc");
});

test("deletes quiz questions and attempts before the quiz", async () => {
    firestore.getDocs
        .mockResolvedValueOnce({ docs: [{ ref: { path: "question" } }] })
        .mockResolvedValueOnce({ docs: [{ ref: { path: "attempt" } }] });
    await deleteQuiz("user-1", "quiz-1");
    expect(firestore.batches).toHaveLength(3);
    expect(
        firestore.batches
            .slice(0, 2)
            .reduce((total, batch) => total + batch.delete.mock.calls.length, 0)
    ).toBe(2);
    expect(firestore.batches[2].delete).toHaveBeenCalledWith(
        expect.objectContaining({ id: "quiz-1" })
    );
});
