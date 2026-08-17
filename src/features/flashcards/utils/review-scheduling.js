export const REVIEW_RATINGS = Object.freeze(["Again", "Hard", "Good", "Easy"]);

const RATING_DAYS = Object.freeze({
    again: 0,
    easy: 7,
    good: 3,
    hard: 1
});

export function toReviewDate(value) {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value.toDate === "function") return value.toDate();
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

export function getReviewSchedule(rating, reviewedAt = new Date()) {
    const easeRating = String(rating || "")
        .trim()
        .toLowerCase();
    if (!(easeRating in RATING_DAYS)) {
        throw new TypeError("A valid flashcard rating is required.");
    }

    const nextReviewAt = new Date(reviewedAt);
    nextReviewAt.setDate(nextReviewAt.getDate() + RATING_DAYS[easeRating]);
    return { easeRating, nextReviewAt };
}

export function isCardDue(card, now = new Date()) {
    const nextReviewAt = toReviewDate(card?.nextReviewAt);
    return !nextReviewAt || nextReviewAt.getTime() <= now.getTime();
}

export function getNextReviewAt(cards) {
    return cards.reduce((earliest, card) => {
        const date = toReviewDate(card?.nextReviewAt);
        if (!date) return earliest;
        return !earliest || date < earliest ? date : earliest;
    }, null);
}

export function formatReviewDate(value, now = new Date()) {
    const date = toReviewDate(value);
    if (!date) return "Not scheduled";

    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (day <= today) return "Today";
    if (day.getTime() === tomorrow.getTime()) return "Tomorrow";
    return date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined
    });
}
