import { beforeEach, expect, test, vi } from "vitest";

const firestore = vi.hoisted(() => ({
    collection: vi.fn((...parts) => ({
        path: parts
            .slice(parts[0] === "db" ? 1 : 0)
            .map((part) => part.path || part)
            .join("/")
    })),
    doc: vi.fn((...parts) => {
        if (parts[0] === "db") {
            return {
                id: parts.at(-1),
                path: parts.slice(1).join("/")
            };
        }
        const [parent, id = "generated-event"] = parts;
        return { id, path: `${parent.path}/${id}` };
    }),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    increment: vi.fn((value) => ({ increment: value })),
    limit: vi.fn((value) => ["limit", value]),
    orderBy: vi.fn((...parts) => ["orderBy", ...parts]),
    query: vi.fn((reference) => reference),
    runTransaction: vi.fn(),
    serverTimestamp: vi.fn(() => "server-time")
}));

vi.mock("firebase/firestore", () => firestore);
vi.mock("../../../firebase/index.js", () => ({ db: "db" }));

import {
    createLearningMemoryKey,
    getLearningMemoryOverview,
    loadLearningMemory,
    recordFlashcardLearningMemory,
    recordQuizLearningMemory
} from "./learning-memory-service.js";

let transaction;

beforeEach(() => {
    vi.clearAllMocks();
    transaction = {
        get: vi.fn().mockResolvedValue({ exists: () => false }),
        set: vi.fn()
    };
    firestore.runTransaction.mockImplementation((_database, callback) =>
        callback(transaction)
    );
});

test("creates stable topic keys and records quiz and concept evidence", async () => {
    expect(createLearningMemoryKey("  Newton's Laws ")).toBe(
        createLearningMemoryKey("newton's laws")
    );

    await recordQuizLearningMemory(
        "user-1",
        { id: "quiz-1", subject: "Motion", title: "Motion quiz" },
        {
            answers: [
                { correct: false, prompt: "What is acceleration?" },
                { correct: true, prompt: "What is velocity?" }
            ],
            id: "attempt-1",
            percentage: 50
        }
    );

    expect(transaction.set).toHaveBeenCalledWith(
        expect.objectContaining({
            path: expect.stringContaining("learningMemory")
        }),
        expect.objectContaining({
            correctSignals: { increment: 1 },
            latestQuizPercentage: 50,
            quizAttempts: { increment: 1 },
            struggleSignals: { increment: 1 }
        }),
        { merge: true }
    );
    expect(transaction.set).toHaveBeenCalledWith(
        expect.objectContaining({ path: expect.stringContaining("concepts") }),
        expect.objectContaining({ label: "What is acceleration?" }),
        { merge: true }
    );
    expect(transaction.set).toHaveBeenCalledWith(
        expect.objectContaining({
            path: expect.stringContaining("activities")
        }),
        expect.objectContaining({ type: "quiz", userId: "user-1" })
    );
});

test("maps flashcard ratings to confidence and struggle evidence", async () => {
    await recordFlashcardLearningMemory(
        "user-1",
        { id: "deck-1", subject: "Biology", title: "Cells" },
        { front: "What does a mitochondrion do?" },
        "Hard",
        "review-1"
    );

    expect(transaction.set).toHaveBeenCalledWith(
        expect.objectContaining({ path: expect.stringContaining("concepts") }),
        expect.objectContaining({
            correctSignals: { increment: 0 },
            struggleSignals: { increment: 1 }
        }),
        { merge: true }
    );
});

test("does not count the same persisted activity twice", async () => {
    transaction.get.mockResolvedValue({ exists: () => true });

    await expect(
        recordQuizLearningMemory(
            "user-1",
            { id: "quiz-1", subject: "Motion", title: "Motion quiz" },
            { answers: [], id: "attempt-1", percentage: 80 }
        )
    ).resolves.toBe(false);
    expect(transaction.set).not.toHaveBeenCalled();
});

test("loads evidence-backed notices and prompt context for Thuto", async () => {
    firestore.getDoc.mockResolvedValue({
        data: () => ({
            correctSignals: 1,
            latestQuizPercentage: 55,
            quizAttempts: 1,
            quizScoreTotal: 55,
            studiedCount: 2,
            struggleSignals: 3,
            studyMinutes: 30,
            topic: "Motion"
        }),
        exists: () => true,
        id: createLearningMemoryKey("Motion")
    });
    firestore.getDocs
        .mockResolvedValueOnce({
            docs: [
                {
                    data: () => ({
                        correctSignals: 0,
                        label: "Acceleration",
                        struggleSignals: 2,
                        updatedAt: null
                    }),
                    id: "acceleration"
                }
            ]
        })
        .mockResolvedValueOnce({ docs: [] });

    const memory = await loadLearningMemory("user-1", {
        id: "motion",
        subject: "Motion",
        title: "Motion"
    });

    expect(memory.notices).toEqual([
        "Your latest Motion quiz result was 55%, so this may need another review.",
        "You struggled with Acceleration last time."
    ]);
    expect(memory.prompt).toContain("StudentHub learning memory");
    expect(memory.prompt).toContain("quiz average: 55%");
    expect(memory.prompt).toContain("latest quiz: 55%");
    expect(memory.topics[0].level).toBe("struggling");
});

test("loads a bounded overview for recommendation scoring", async () => {
    firestore.getDocs.mockResolvedValue({
        docs: [
            {
                data: () => ({
                    correctSignals: 2,
                    latestQuizPercentage: 50,
                    quizAttempts: 2,
                    quizScoreTotal: 120,
                    struggleSignals: 4,
                    topic: "Calculus",
                    updatedAt: {
                        toDate: () => new Date("2026-08-20")
                    }
                }),
                id: "calculus"
            }
        ]
    });

    await expect(getLearningMemoryOverview("user-1")).resolves.toEqual([
        expect.objectContaining({
            averageQuizPercentage: 60,
            id: "calculus",
            latestQuizPercentage: 50,
            level: "struggling",
            topic: "Calculus",
            updatedAt: new Date("2026-08-20")
        })
    ]);
    expect(firestore.orderBy).toHaveBeenCalledWith("updatedAt", "desc");
});
