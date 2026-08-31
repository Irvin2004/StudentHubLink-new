import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    onSnapshot: vi.fn(),
    setDoc: vi.fn(),
    timestamp: { type: "server-timestamp" },
    transaction: {
        delete: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        update: vi.fn()
    }
}));

vi.mock("firebase/firestore", () => ({
    collection: (...parts) => ({
        path: parts.map((part) => part.path || part).join("/")
    }),
    collectionGroup: vi.fn((database, name) => ({ database, name })),
    deleteDoc: vi.fn(),
    doc: (...parts) => {
        const path = parts.map((part) => part.path || part).join("/");
        return { id: String(parts.at(-1) || "generated-id"), path };
    },
    getDocs: vi.fn(),
    limit: vi.fn((value) => ({ limit: value })),
    onSnapshot: mocks.onSnapshot,
    orderBy: vi.fn((field, direction) => ({ direction, field })),
    query: vi.fn((...parts) => parts),
    runTransaction: vi.fn(async (database, callback) =>
        callback(mocks.transaction)
    ),
    serverTimestamp: () => mocks.timestamp,
    setDoc: mocks.setDoc,
    updateDoc: vi.fn(),
    where: vi.fn((...parts) => ({ where: parts })),
    writeBatch: vi.fn(() => ({ commit: vi.fn(), delete: vi.fn() }))
}));
vi.mock("../../../firebase/index.js", () => ({ db: { path: "db" } }));

import {
    acceptAnswer,
    createAnswer,
    createQuestion,
    toggleAnswerUpvote,
    toggleQuestionUpvote
} from "./community-question-service.js";

beforeEach(() => {
    vi.clearAllMocks();
    mocks.setDoc.mockResolvedValue();
});

describe("community question service", () => {
    test("creates an unanswered question with author and resource context", async () => {
        await createQuestion(
            "community-1",
            { id: "user-1", displayName: "Neo" },
            {
                description: "Please explain this proof.",
                linkedResource: { id: "file-1", title: "Calculus notes" },
                tags: ["Calculus"],
                title: "Why does this limit exist?"
            }
        );

        expect(mocks.setDoc).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                answerCount: 0,
                authorId: "user-1",
                linkedResource: { id: "file-1", title: "Calculus notes" },
                status: "unanswered"
            })
        );
    });

    test("adds an answer and advances an unanswered question", async () => {
        mocks.transaction.get.mockResolvedValueOnce({
            data: () => ({
                answerCount: 0,
                authorId: "user-1",
                status: "unanswered"
            }),
            exists: () => true
        });

        await createAnswer(
            "community-1",
            "question-1",
            { id: "user-2", displayName: "Mpho" },
            "Use the squeeze theorem."
        );

        expect(mocks.transaction.set).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                authorId: "user-2",
                questionAuthorId: "user-1",
                upvoteCount: 0
            })
        );
        expect(mocks.transaction.update).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ answerCount: 1, status: "answered" })
        );
    });

    test("accepts an answer and records solved state", async () => {
        mocks.transaction.get.mockResolvedValueOnce({
            data: () => ({ acceptedAnswerId: null }),
            exists: () => true
        });

        await acceptAnswer("community-1", "question-1", "answer-1");

        expect(mocks.transaction.update).toHaveBeenCalledWith(
            expect.objectContaining({ id: "answer-1" }),
            expect.objectContaining({ accepted: true })
        );
        expect(mocks.transaction.update).toHaveBeenCalledWith(
            expect.objectContaining({ id: "question-1" }),
            expect.objectContaining({
                acceptedAnswerId: "answer-1",
                status: "solved"
            })
        );
    });

    test("stores one upvote document and increments the answer count", async () => {
        mocks.transaction.get
            .mockResolvedValueOnce({
                data: () => ({
                    authorId: "user-2",
                    authorName: "Mpho",
                    upvoteCount: 2
                }),
                exists: () => true
            })
            .mockResolvedValueOnce({ exists: () => false });

        await expect(
            toggleAnswerUpvote(
                "community-1",
                "question-1",
                "answer-1",
                "user-3"
            )
        ).resolves.toBe(true);

        expect(mocks.transaction.set).toHaveBeenCalledWith(
            expect.objectContaining({ id: "user-3" }),
            expect.objectContaining({
                recipientId: "user-2",
                recipientName: "Mpho",
                userId: "user-3"
            })
        );
        expect(mocks.transaction.update).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ upvoteCount: 3 })
        );
    });

    test("marks a question helpful without allowing self-upvotes", async () => {
        mocks.transaction.get
            .mockResolvedValueOnce({
                data: () => ({
                    authorId: "user-1",
                    authorName: "Neo",
                    upvoteCount: 4
                }),
                exists: () => true
            })
            .mockResolvedValueOnce({ exists: () => false });

        await expect(
            toggleQuestionUpvote("community-1", "question-1", "user-3")
        ).resolves.toBe(true);

        expect(mocks.transaction.set).toHaveBeenCalledWith(
            expect.objectContaining({ id: "user-3" }),
            expect.objectContaining({
                recipientId: "user-1",
                recipientName: "Neo",
                userId: "user-3"
            })
        );
        expect(mocks.transaction.update).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ upvoteCount: 5 })
        );
    });
});
