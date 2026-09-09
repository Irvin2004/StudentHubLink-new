import { describe, expect, test } from "vitest";

import {
    formatCollectionItemContext,
    KNOWLEDGE_ITEM_TYPES,
    normalizeKnowledgeItem,
    validateKnowledgeCollection
} from "./knowledge-collection.js";

const actor = { displayName: "Neo", id: "student-1" };

describe("knowledge collection model", () => {
    test("normalizes an ordered mixed-content collection", () => {
        const collection = validateKnowledgeCollection(
            {
                description: "A focused path through the exam topics.",
                items: [
                    {
                        sourceId: "file-1",
                        sourceType: KNOWLEDGE_ITEM_TYPES.RESOURCE,
                        title: "Limits notes"
                    },
                    {
                        content: "The accepted explanation.",
                        sourceId: "question-1:answer-1",
                        sourceType: KNOWLEDGE_ITEM_TYPES.ANSWER,
                        title: "Why the limit exists"
                    }
                ],
                tags: [" Calculus ", "limits", "calculus"],
                title: "Calculus Exam Prep"
            },
            actor
        );

        expect(collection.tags).toEqual(["calculus", "limits"]);
        expect(collection.items.map((item) => item.sourceType)).toEqual([
            "resource",
            "answer"
        ]);
        expect(collection.items[0]).toMatchObject({
            addedBy: "student-1",
            addedByName: "Neo"
        });
    });

    test("requires useful metadata and prevents duplicate sources", () => {
        const item = {
            sourceId: "quiz-1",
            sourceType: KNOWLEDGE_ITEM_TYPES.QUIZ,
            title: "Week 4 quiz"
        };
        expect(() =>
            validateKnowledgeCollection(
                {
                    description: "Practice",
                    items: [item, item],
                    tags: ["programming"],
                    title: "Programming Week 4"
                },
                actor
            )
        ).toThrow("only be added once");
    });

    test("formats item snapshots for Thuto context", () => {
        const item = normalizeKnowledgeItem(
            {
                content: "Question one — correct answer",
                sourceId: "quiz-1",
                sourceType: KNOWLEDGE_ITEM_TYPES.QUIZ,
                title: "Practice quiz"
            },
            actor
        );
        expect(formatCollectionItemContext(item)).toContain(
            "Quiz: Practice quiz"
        );
        expect(formatCollectionItemContext(item)).toContain("correct answer");
    });
});
