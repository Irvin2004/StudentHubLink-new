import { describe, expect, test } from "vitest";

import {
    createDiscoverResult,
    DISCOVER_TYPES
} from "../models/discover-result.js";
import { createDiscoverStudyContext } from "./discover-study-context.js";

describe("discovery Thuto context", () => {
    test("keeps collection materials in the existing collection-aware context", async () => {
        const context = await createDiscoverStudyContext(
            createDiscoverResult({
                communityId: "community-1",
                id: "collection:community-1:collection-1",
                source: {
                    id: "collection-1",
                    items: [
                        {
                            content: "Limits describe approaching values.",
                            id: "answer:1",
                            sourceId: "1",
                            sourceType: "answer",
                            title: "Understanding limits"
                        }
                    ],
                    title: "Calculus Exam Prep"
                },
                studyEligible: true,
                title: "Calculus Exam Prep",
                type: DISCOVER_TYPES.COLLECTION
            }),
            "user-1"
        );

        expect(context.id).toContain("collection:community-1:collection-1");
        expect(context.content).toContain(
            "Limits describe approaching values."
        );
        expect(context.resources).toHaveLength(1);
    });

    test("includes the accepted answer when studying a solved question", async () => {
        const context = await createDiscoverStudyContext(
            createDiscoverResult({
                id: "question:community-1:q1",
                source: {
                    acceptedAnswer: { content: "Use the squeeze theorem." },
                    description: "How can this limit be solved?"
                },
                studyEligible: true,
                title: "A difficult limit",
                type: DISCOVER_TYPES.QUESTION
            }),
            "user-1"
        );

        expect(context.content).toContain("Use the squeeze theorem.");
    });
});
