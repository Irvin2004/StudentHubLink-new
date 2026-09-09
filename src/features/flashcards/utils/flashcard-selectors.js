import { isCardDue, toReviewDate } from "./review-scheduling.js";

function timestampValue(value) {
    if (typeof value?.toMillis === "function") return value.toMillis();
    if (typeof value?.toDate === "function") return value.toDate().getTime();
    if (value instanceof Date) return value.getTime();
    const time = new Date(value || 0).getTime();
    return Number.isFinite(time) ? time : 0;
}

function isSameLocalDay(first, second) {
    return (
        first?.getFullYear() === second.getFullYear() &&
        first?.getMonth() === second.getMonth() &&
        first?.getDate() === second.getDate()
    );
}

export function selectDueFlashcards(cards = [], now = new Date()) {
    return cards.filter((card) => isCardDue(card, now));
}

export function getFlashcardDeckStats(cards = [], now = new Date()) {
    const totalCards = cards.length;
    const dueCards = selectDueFlashcards(cards, now).length;
    const reviewedToday = cards.filter((card) => {
        const reviewedAt = toReviewDate(card.lastReviewedAt);
        return reviewedAt && isSameLocalDay(reviewedAt, now);
    }).length;
    const masteredCards = cards.filter((card) =>
        ["good", "easy"].includes(String(card.easeRating || "").toLowerCase())
    ).length;

    return {
        dueCards,
        masteryPercentage: totalCards
            ? Math.round((masteredCards / totalCards) * 100)
            : 0,
        reviewedToday,
        totalCards
    };
}

export function filterFlashcardDecks(
    decks = [],
    { query = "", reviewStatus = "all" } = {}
) {
    const normalizedQuery = String(query).trim().toLowerCase();
    return decks.filter((deck) => {
        const matchesQuery =
            !normalizedQuery ||
            String(deck.title || "")
                .toLowerCase()
                .includes(normalizedQuery) ||
            String(deck.subject || "")
                .toLowerCase()
                .includes(normalizedQuery);
        const hasDueCards = Number(deck.dueCount) > 0;
        const matchesReviewStatus =
            reviewStatus === "all" ||
            (reviewStatus === "due" && hasDueCards) ||
            (reviewStatus === "caught-up" && !hasDueCards);
        return matchesQuery && matchesReviewStatus;
    });
}

export function selectDueFlashcardCount(decks = []) {
    return decks.reduce(
        (total, deck) => total + Math.max(0, Number(deck.dueCount) || 0),
        0
    );
}

export function selectRecentFlashcardDecks(decks = [], limit = 10) {
    return [...decks]
        .filter((deck) => timestampValue(deck.lastStudiedAt) > 0)
        .sort(
            (first, second) =>
                timestampValue(second.lastStudiedAt) -
                timestampValue(first.lastStudiedAt)
        )
        .slice(0, limit);
}

export function selectDueFlashcardDeck(decks = []) {
    return (
        [...decks]
            .filter((deck) => Number(deck.dueCount) > 0)
            .sort((first, second) => {
                const dueDifference = second.dueCount - first.dueCount;
                if (dueDifference) return dueDifference;
                return String(first.title).localeCompare(String(second.title));
            })[0] || null
    );
}

export function getFlashcardDashboardData(decks = []) {
    return {
        dueCount: selectDueFlashcardCount(decks),
        dueDeck: selectDueFlashcardDeck(decks),
        recentDecks: selectRecentFlashcardDecks(decks)
    };
}

export function toFlashcardFocus(deck) {
    if (!deck || !Number(deck.dueCount)) return null;
    const dueCount = Number(deck.dueCount);
    return {
        due: `${dueCount} ${dueCount === 1 ? "card" : "cards"} due`,
        estimatedTime: `${Math.max(5, dueCount * 2)}m`,
        flashcardDeckId: deck.id,
        id: deck.id,
        priority: dueCount >= 10 ? "High" : "Medium",
        subject: deck.subject,
        title: `Review ${deck.title}`,
        type: "flashcards"
    };
}

export { timestampValue as flashcardTimestamp };
