import { describe, expect, test } from "vitest";

import { buildDiscoverCatalog } from "./discovery-service.js";

describe("permission-aware discovery catalog", () => {
    test("never includes private communities or community content without membership", () => {
        const commonCommunity = {
            category: "math",
            createdAt: new Date(),
            description: "Math",
            memberCount: 3,
            name: "Math",
            updatedAt: new Date()
        };
        const catalog = buildDiscoverCatalog({
            communities: [
                { ...commonCommunity, id: "joined", visibility: "private" },
                { ...commonCommunity, id: "hidden", visibility: "private" },
                { ...commonCommunity, id: "public", visibility: "public" }
            ],
            memberCommunityIds: ["joined"],
            questionsByCommunity: [
                {
                    communityId: "hidden",
                    questions: [
                        {
                            authorId: "student-2",
                            authorName: "Student",
                            description: "Secret answer",
                            id: "secret",
                            status: "solved",
                            tags: ["private"],
                            title: "Hidden question"
                        }
                    ]
                }
            ],
            resources: [
                {
                    communityId: "hidden",
                    originalName: "secret.pdf",
                    resourceKey: "hidden:general:secret",
                    title: "Secret notes",
                    uploadedBy: "student-2"
                }
            ]
        });

        expect(catalog.map((item) => item.id)).toEqual([
            "community:joined",
            "community:public"
        ]);
    });

    test("shows personal quizzes and flashcards without publishing them to a community", () => {
        const catalog = buildDiscoverCatalog({
            decks: [
                {
                    cardCount: 12,
                    id: "deck-1",
                    subject: "Math",
                    title: "Limits"
                }
            ],
            quizzes: [
                {
                    id: "quiz-1",
                    questionCount: 5,
                    subject: "Math",
                    title: "Limits quiz"
                }
            ],
            user: { displayName: "Ama", uid: "user-1" }
        });

        expect(catalog.map((item) => item.type)).toEqual([
            "quiz",
            "flashcard_set"
        ]);
        expect(catalog.every((item) => item.communityId === "")).toBe(true);
    });
});
