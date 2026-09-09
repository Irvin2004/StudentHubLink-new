import { expect, test } from "vitest";

import {
    formatReviewDate,
    getNextReviewAt,
    getReviewSchedule,
    isCardDue
} from "./review-scheduling.js";

const now = new Date(2026, 7, 10, 12);

test.each([
    ["Again", 10],
    ["Hard", 11],
    ["Good", 13],
    ["Easy", 17]
])("schedules %s with the MVP interval", (rating, expectedDay) => {
    expect(getReviewSchedule(rating, now).nextReviewAt.getDate()).toBe(
        expectedDay
    );
});

test("treats new, missing, and elapsed schedules as due", () => {
    expect(isCardDue({}, now)).toBe(true);
    expect(isCardDue({ nextReviewAt: new Date(2026, 7, 10, 11) }, now)).toBe(
        true
    );
    expect(isCardDue({ nextReviewAt: new Date(2026, 7, 11) }, now)).toBe(false);
});

test("finds and formats the next review date", () => {
    const tomorrow = new Date(2026, 7, 11, 9);
    const later = { toDate: () => new Date(2026, 7, 13, 9) };
    expect(
        getNextReviewAt([{ nextReviewAt: later }, { nextReviewAt: tomorrow }])
    ).toEqual(tomorrow);
    expect(formatReviewDate(tomorrow, now)).toBe("Tomorrow");
});
