import { expect, test } from "vitest";

import {
    filterFlashcardDecks,
    getFlashcardDeckStats,
    getFlashcardDashboardData,
    selectDueFlashcardDeck,
    selectDueFlashcards,
    selectRecentFlashcardDecks
} from "./flashcard-selectors.js";

const decks = [
    {
        dueCount: 2,
        id: "older",
        lastStudiedAt: new Date("2026-08-08"),
        title: "Older"
    },
    {
        dueCount: 4,
        id: "recent",
        lastStudiedAt: { toDate: () => new Date("2026-08-10") },
        title: "Recent"
    },
    { dueCount: 0, id: "new", title: "Never studied" }
];

test("selects recent decks and the strongest due deck", () => {
    expect(selectRecentFlashcardDecks(decks).map((deck) => deck.id)).toEqual([
        "recent",
        "older"
    ]);
    expect(selectDueFlashcardDeck(decks).id).toBe("recent");
});

test("composes due and recent dashboard data", () => {
    expect(getFlashcardDashboardData(decks)).toEqual(
        expect.objectContaining({ dueCount: 6, dueDeck: decks[1] })
    );
});

test("selects due cards and derives deck study statistics", () => {
    const now = new Date(2026, 7, 10, 12);
    const cards = [
        {
            easeRating: "good",
            lastReviewedAt: new Date(2026, 7, 10, 9),
            nextReviewAt: new Date(2026, 7, 13)
        },
        {
            easeRating: "easy",
            lastReviewedAt: new Date(2026, 7, 9),
            nextReviewAt: new Date(2026, 7, 10, 10)
        },
        { nextReviewAt: null }
    ];

    expect(selectDueFlashcards(cards, now)).toEqual([cards[1], cards[2]]);
    expect(getFlashcardDeckStats(cards, now)).toEqual({
        dueCards: 2,
        masteryPercentage: 67,
        reviewedToday: 1,
        totalCards: 3
    });
});

test("filters decks by title, subject, and due-review state", () => {
    const searchableDecks = [
        { dueCount: 3, subject: "Robotics", title: "Control systems" },
        { dueCount: 0, subject: "Database", title: "SQL basics" }
    ];

    expect(filterFlashcardDecks(searchableDecks, { query: "robot" })).toEqual([
        searchableDecks[0]
    ]);
    expect(
        filterFlashcardDecks(searchableDecks, { reviewStatus: "due" })
    ).toEqual([searchableDecks[0]]);
    expect(
        filterFlashcardDecks(searchableDecks, {
            query: "sql",
            reviewStatus: "caught-up"
        })
    ).toEqual([searchableDecks[1]]);
});
