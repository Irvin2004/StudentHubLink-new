import { describe, expect, test } from "vitest";

import { createCollectionStudyContext } from "./collection-study-context.js";

describe("collection study context", () => {
    test("passes every ordered collection material into bounded multi-resource context", async () => {
        const items = Array.from({ length: 8 }, (_, index) => ({
            content: `Study content ${index + 1}`,
            id: `answer:question-${index}:answer-${index}`,
            sourceId: `question-${index}:answer-${index}`,
            sourceType: "answer",
            title: `Useful answer ${index + 1}`
        }));

        const context = await createCollectionStudyContext("community-1", {
            id: "collection-1",
            items,
            title: "Calculus Exam Prep"
        });

        expect(context.id).toContain("collection:community-1:collection-1");
        expect(context.title).toBe("Calculus Exam Prep");
        expect(context.resources).toHaveLength(5);
        expect(
            context.resources.flatMap((resource) => resource.memoryLabels)
        ).toEqual(expect.arrayContaining(items.map((item) => item.title)));
        for (const item of items) {
            expect(context.content).toContain(item.content);
        }
    });
});
