import { describe, expect, test } from "vitest";

import {
    createDiscoverResult,
    DISCOVER_TYPES,
    filterAndRankDiscoverResults
} from "./discover-result.js";

function result(overrides) {
    return createDiscoverResult({
        id: overrides.title,
        title: overrides.title,
        type: DISCOVER_TYPES.RESOURCE,
        updatedAt: new Date("2026-08-01T00:00:00Z"),
        ...overrides
    });
}

describe("knowledge discovery ranking", () => {
    test("combines understandable relevance, helpfulness, and freshness", () => {
        const ranked = filterAndRankDiscoverResults(
            [
                result({
                    helpfulness: 2,
                    tags: ["calculus"],
                    title: "Calculus limits overview"
                }),
                result({
                    helpfulness: 200,
                    title: "Biology cells"
                })
            ],
            { query: "calculus limits" },
            new Date("2026-09-01T00:00:00Z").getTime()
        );

        expect(ranked).toHaveLength(1);
        expect(ranked[0].title).toBe("Calculus limits overview");
        expect(ranked[0].ranking).toEqual(
            expect.objectContaining({
                freshness: expect.any(Number),
                helpfulness: expect.any(Number),
                relevance: expect.any(Number),
                score: expect.any(Number)
            })
        );
    });

    test("filters by content type, subject, and community", () => {
        const ranked = filterAndRankDiscoverResults(
            [
                result({
                    communityId: "math",
                    subject: "calculus",
                    title: "Limits"
                }),
                result({
                    communityId: "science",
                    subject: "biology",
                    title: "Cells",
                    type: DISCOVER_TYPES.QUIZ
                })
            ],
            {
                community: "science",
                subject: "biology",
                type: DISCOVER_TYPES.QUIZ
            }
        );

        expect(ranked.map((item) => item.title)).toEqual(["Cells"]);
    });
});
