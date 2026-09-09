import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

const services = vi.hoisted(() => ({
    createFlashcard: vi.fn(),
    createFlashcardDeck: vi.fn(),
    deleteFlashcard: vi.fn(),
    deleteFlashcardDeck: vi.fn(),
    getFlashcardDecks: vi.fn(),
    getFlashcards: vi.fn(),
    recordFlashcardDeckStudied: vi.fn(),
    reviewFlashcard: vi.fn(),
    updateFlashcard: vi.fn()
}));
const quizzes = vi.hoisted(() => ({
    createQuizFromFlashcardDeck: vi.fn(),
    getQuizzes: vi.fn()
}));
const memory = vi.hoisted(() => ({
    recordFlashcardLearningMemory: vi.fn()
}));

vi.mock("../../../hooks/useAuth.js", () => ({
    useAuth: () => ({ user: { uid: "user-1" } })
}));
vi.mock("../services/flashcard-service.js", () => services);
vi.mock("../../quizzes/services/quiz-service.js", () => quizzes);
vi.mock(
    "../../learningMemory/services/learning-memory-service.js",
    () => memory
);

import { useFlashcards } from "./useFlashcards.js";

beforeEach(() => {
    vi.clearAllMocks();
    services.getFlashcardDecks.mockResolvedValue([
        {
            cardCount: 1,
            dueCount: 1,
            id: "deck-1",
            subject: "Robotics",
            title: "Robotics deck"
        }
    ]);
    quizzes.getQuizzes.mockResolvedValue([]);
    services.getFlashcards.mockResolvedValue([
        { back: "Answer", front: "Question", id: "card-1" }
    ]);
    services.createFlashcard.mockResolvedValue({
        back: "New answer",
        front: "New question",
        id: "card-2"
    });
    services.deleteFlashcard.mockResolvedValue(undefined);
    services.deleteFlashcardDeck.mockResolvedValue(undefined);
    services.reviewFlashcard.mockResolvedValue({
        easeRating: "good",
        lastReviewedAt: new Date(),
        nextReviewAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        reviewCount: 1
    });
    services.recordFlashcardDeckStudied.mockResolvedValue({
        lastStudiedAt: new Date()
    });
    memory.recordFlashcardLearningMemory.mockResolvedValue(true);
});

test("persists a rating and immediately refreshes the due count", async () => {
    const { result } = renderHook(() => useFlashcards());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.selectDeck("deck-1"));
    await waitFor(() => expect(result.current.cards).toHaveLength(1));

    await act(async () => {
        await result.current.rateCard("card-1", "Good");
    });

    expect(services.reviewFlashcard).toHaveBeenCalledWith(
        "user-1",
        "deck-1",
        "card-1",
        "Good",
        1
    );
    expect(memory.recordFlashcardLearningMemory).toHaveBeenCalledWith(
        "user-1",
        expect.objectContaining({ id: "deck-1" }),
        expect.objectContaining({ id: "card-1" }),
        "Good",
        "flashcard:deck-1:card-1:1"
    );
    expect(result.current.cards[0].easeRating).toBe("good");
    expect(result.current.selectedDeck.dueCount).toBe(0);
});

test("loads decks and keeps card counts in sync with card mutations", async () => {
    const { result } = renderHook(() => useFlashcards());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.selectDeck("deck-1"));
    await waitFor(() => expect(result.current.cards).toHaveLength(1));

    await act(async () => {
        await result.current.addCard({
            back: "New answer",
            front: "New question"
        });
    });
    expect(result.current.cards).toHaveLength(2);
    expect(result.current.selectedDeck.cardCount).toBe(2);

    await act(async () => {
        await result.current.removeCard("card-2");
    });
    expect(result.current.cards).toHaveLength(1);
    expect(result.current.selectedDeck.cardCount).toBe(1);
});

test("removes a selected deck and clears its cards", async () => {
    const { result } = renderHook(() => useFlashcards());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.selectDeck("deck-1"));
    await waitFor(() => expect(result.current.cards).toHaveLength(1));

    await act(async () => {
        await result.current.removeDeck("deck-1");
    });

    expect(result.current.decks).toEqual([]);
    expect(result.current.selectedDeck).toBeNull();
    expect(result.current.cards).toEqual([]);
});

test("creates and links a quiz from four flashcards", async () => {
    services.getFlashcards.mockResolvedValue([
        { back: "A", front: "Question A", id: "card-1" },
        { back: "B", front: "Question B", id: "card-2" },
        { back: "C", front: "Question C", id: "card-3" },
        { back: "D", front: "Question D", id: "card-4" }
    ]);
    quizzes.createQuizFromFlashcardDeck.mockResolvedValue({
        flashcardDeckId: "deck-1",
        id: "quiz-1",
        title: "Robotics deck Quiz"
    });
    const { result } = renderHook(() => useFlashcards());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.selectDeck("deck-1"));
    await waitFor(() => expect(result.current.cards).toHaveLength(4));

    await act(() => result.current.createQuizFromDeck());

    expect(quizzes.createQuizFromFlashcardDeck).toHaveBeenCalledWith(
        "user-1",
        expect.objectContaining({ id: "deck-1" }),
        expect.arrayContaining([
            expect.objectContaining({ sourceFlashcardId: "card-1" })
        ])
    );
    expect(result.current.linkedQuizzes[0].id).toBe("quiz-1");
});
