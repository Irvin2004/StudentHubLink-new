import { describe, expect, test } from "vitest";

import { generateMemoryPlannerRecommendations } from "./memory-planner-recommendations.js";

const now = new Date("2026-09-05T10:00:00");

describe("learning-memory planner recommendations", () => {
    test("prioritizes struggling concepts over broad topic advice", () => {
        const recommendations = generateMemoryPlannerRecommendations(
            {
                memoryTopics: [
                    {
                        concepts: [
                            {
                                correctSignals: 1,
                                id: "limits",
                                label: "Calculus limits",
                                level: "struggling",
                                struggleSignals: 4,
                                updatedAt: new Date("2026-09-04")
                            }
                        ],
                        id: "calculus",
                        latestQuizPercentage: 52,
                        level: "struggling",
                        topic: "Calculus",
                        updatedAt: new Date("2026-09-04")
                    }
                ]
            },
            now
        );

        expect(recommendations).toHaveLength(1);
        expect(recommendations[0]).toEqual(
            expect.objectContaining({
                evidence: "4 struggle signals · 1 correct",
                subject: "Calculus",
                title: "Review Calculus limits"
            })
        );
        expect(recommendations[0].studyPlan).toEqual(
            expect.objectContaining({ priority: "High" })
        );
    });

    test("does not recommend a focus already represented by an active task", () => {
        const recommendations = generateMemoryPlannerRecommendations(
            {
                memoryTopics: [
                    {
                        concepts: [],
                        id: "biology",
                        level: "struggling",
                        topic: "Biology"
                    }
                ],
                plannerTasks: [
                    {
                        completed: false,
                        subject: "Biology",
                        title: "Review Biology"
                    }
                ]
            },
            now
        );

        expect(recommendations).toEqual([]);
    });

    test("suggests neglected developing topics at a lower priority", () => {
        const [recommendation] = generateMemoryPlannerRecommendations(
            {
                memoryTopics: [
                    {
                        concepts: [],
                        id: "accounting",
                        level: "developing",
                        topic: "Accounting",
                        updatedAt: new Date("2026-08-01")
                    }
                ]
            },
            now
        );

        expect(recommendation.title).toBe("Refresh Accounting");
        expect(recommendation.reason).toContain("35 days");
    });
});
