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
    getDocs: vi.fn(),
    limit: vi.fn((value) => ["limit", value]),
    orderBy: vi.fn((...parts) => parts),
    query: vi.fn((reference) => reference),
    serverTimestamp: vi.fn(() => "server-time"),
    setDoc: vi.fn(),
    Timestamp: { fromDate: vi.fn((date) => `timestamp:${date.toISOString()}`) },
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
    createFlashcard,
    createFlashcardDeck,
    deleteFlashcard,
    deleteFlashcardDeck,
    getFlashcardDecks,
    getFlashcards,
    recordFlashcardDeckStudied,
    reviewFlashcard,
    updateFlashcard
} from "./flashcard-service.js";

beforeEach(() => {
    vi.clearAllMocks();
    firestore.batches.length = 0;
});

test("creates resource-linked decks and records recent study activity", async () => {
    await createFlashcardDeck("user-1", {
        resourceId: "science:general:file-1",
        subject: "Science",
        title: "Motion notes"
    });
    expect(firestore.setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ resourceId: "science:general:file-1" })
    );

    await recordFlashcardDeckStudied("user-1", "deck-1");
    expect(firestore.updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: "deck-1" }),
        { lastStudiedAt: "server-time", updatedAt: "server-time" }
    );
});

test("loads decks with their card counts", async () => {
    firestore.getDocs.mockResolvedValueOnce({
        docs: [
            {
                data: () => ({ subject: "Robotics", title: "Robotics deck" }),
                id: "deck-1"
            }
        ]
    });
    firestore.getDocs.mockResolvedValueOnce({
        docs: Array.from({ length: 4 }, () => ({ data: () => ({}) }))
    });

    await expect(getFlashcardDecks("user-1")).resolves.toEqual([
        {
            cardCount: 4,
            dueCount: 4,
            id: "deck-1",
            masteryPercentage: 0,
            reviewedToday: 0,
            subject: "Robotics",
            title: "Robotics deck"
        }
    ]);
});

test("loads cards from the selected deck", async () => {
    firestore.getDocs.mockResolvedValue({
        docs: [
            {
                data: () => ({ back: "Answer", front: "Question" }),
                id: "card-1"
            }
        ]
    });

    await expect(getFlashcards("user-1", "deck-1")).resolves.toEqual([
        { back: "Answer", front: "Question", id: "card-1" }
    ]);
});

test("creates a deck with Firestore timestamps", async () => {
    await createFlashcardDeck("user-1", {
        subject: " Robotics ",
        title: " Robot basics "
    });

    expect(firestore.setDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: "generated-id" }),
        {
            createdAt: "server-time",
            subject: "Robotics",
            title: "Robot basics",
            updatedAt: "server-time"
        }
    );
});

test("creates, edits, and deletes cards through atomic batches", async () => {
    await createFlashcard("user-1", "deck-1", {
        back: " Answer ",
        front: " Question "
    });
    await updateFlashcard("user-1", "deck-1", "card-1", {
        back: "Updated answer",
        front: "Updated question"
    });
    await deleteFlashcard("user-1", "deck-1", "card-1");

    expect(firestore.batches).toHaveLength(3);
    expect(firestore.batches[0].set).toHaveBeenCalledWith(
        expect.objectContaining({ id: "generated-id" }),
        expect.objectContaining({
            back: "Answer",
            easeRating: null,
            front: "Question",
            reviewCount: 0
        })
    );
    expect(firestore.batches[1].update).toHaveBeenCalledWith(
        expect.objectContaining({ id: "card-1" }),
        expect.objectContaining({
            back: "Updated answer",
            front: "Updated question"
        })
    );
    expect(firestore.batches[2].delete).toHaveBeenCalledWith(
        expect.objectContaining({ id: "card-1" })
    );
});

test("persists review scheduling and review counts atomically", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-10T10:00:00.000Z"));

    const result = await reviewFlashcard(
        "user-1",
        "deck-1",
        "card-1",
        "Good",
        3
    );

    expect(firestore.batches[0].update).toHaveBeenCalledWith(
        expect.objectContaining({ id: "card-1" }),
        expect.objectContaining({
            easeRating: "good",
            lastReviewedAt: "server-time",
            nextReviewAt: "timestamp:2026-08-13T10:00:00.000Z",
            reviewCount: 3
        })
    );
    expect(result.nextReviewAt).toEqual(new Date("2026-08-13T10:00:00.000Z"));
    vi.useRealTimers();
});

test("deletes a deck's cards before deleting the deck", async () => {
    const cardReference = { path: "users/user-1/decks/deck-1/cards/card-1" };
    firestore.getDocs.mockResolvedValue({ docs: [{ ref: cardReference }] });

    await deleteFlashcardDeck("user-1", "deck-1");

    expect(firestore.batches).toHaveLength(2);
    expect(firestore.batches[0].delete).toHaveBeenCalledWith(cardReference);
    expect(firestore.batches[1].delete).toHaveBeenCalledWith(
        expect.objectContaining({ id: "deck-1" })
    );
});
