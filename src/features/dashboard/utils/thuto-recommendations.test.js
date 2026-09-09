import { expect, test } from "vitest";

import { generateThutoRecommendations } from "./thuto-recommendations.js";

const now = new Date("2026-08-29T12:00:00Z");

test("scores deadlines, weak topics, poor quizzes, and due cards", () => {
    const recommendations = generateThutoRecommendations(
        {
            flashcardDecks: [
                {
                    cardCount: 30,
                    dueCount: 20,
                    id: "deck-1",
                    subject: "Biology",
                    title: "Cell Biology"
                }
            ],
            memoryTopics: [
                {
                    correctSignals: 1,
                    id: "calculus",
                    latestQuizPercentage: 45,
                    level: "struggling",
                    struggleSignals: 4,
                    topic: "Calculus limits",
                    updatedAt: new Date("2026-08-20")
                }
            ],
            plannerTasks: [
                {
                    completed: false,
                    dueDate: "2026-08-28",
                    id: "task-1",
                    priority: "High",
                    subject: "Accounting",
                    title: "Accounting worksheet"
                }
            ],
            quizzes: [
                {
                    attempts: [
                        {
                            completedAt: new Date("2026-08-21"),
                            percentage: 50
                        }
                    ],
                    id: "quiz-1",
                    subject: "Biology",
                    title: "Biology Quiz 2"
                }
            ],
            resources: [
                {
                    lastOpened: null,
                    resourceKey: "calculus:chapter-4",
                    title: "Calculus limits"
                }
            ]
        },
        now
    );

    expect(recommendations).toHaveLength(5);
    expect(recommendations.map((item) => item.title)).toEqual(
        expect.arrayContaining([
            "Complete Accounting worksheet",
            "Review Calculus limits",
            "Retake Biology Quiz 2",
            "Complete 20 flashcards from Cell Biology",
            "Study Calculus limits"
        ])
    );
    expect(
        recommendations.find((item) => item.id === "quiz:quiz-1")
    ).toMatchObject({
        actionLabel: "Retake quiz",
        reason: "Latest score was 50%",
        studyPlan: {
            priority: "High",
            quizId: "quiz-1",
            taskType: "quiz"
        },
        target: { feature: "quiz", id: "quiz-1", mode: "take" }
    });
});

test("does not offer the same linked material twice when it is already planned", () => {
    const recommendations = generateThutoRecommendations(
        {
            plannerTasks: [
                {
                    completed: false,
                    dueDate: "2026-08-31",
                    id: "planned-quiz",
                    priority: "High",
                    quizId: "quiz-1",
                    subject: "Biology",
                    taskType: "quiz",
                    title: "Retake Biology"
                }
            ],
            quizzes: [
                {
                    attempts: [{ percentage: 40 }],
                    id: "quiz-1",
                    subject: "Biology",
                    title: "Biology Quiz"
                }
            ]
        },
        now
    );

    expect(recommendations.some((item) => item.id === "quiz:quiz-1")).toBe(
        false
    );
    expect(recommendations[0]).toMatchObject({
        alreadyPlanned: true,
        id: "planner:planned-quiz"
    });
    expect(recommendations[0].studyPlan).toBeUndefined();
});

test("penalizes very recent study and routes neglected topics to a session", () => {
    const recommendations = generateThutoRecommendations(
        {
            memoryTopics: [
                {
                    correctSignals: 4,
                    id: "accounting",
                    latestQuizPercentage: 90,
                    level: "confident",
                    struggleSignals: 0,
                    topic: "Accounting",
                    updatedAt: new Date("2026-08-01")
                },
                {
                    correctSignals: 4,
                    id: "physics",
                    latestQuizPercentage: 90,
                    level: "confident",
                    struggleSignals: 0,
                    topic: "Physics",
                    updatedAt: new Date("2026-08-29")
                }
            ]
        },
        now
    );

    expect(recommendations[0]).toMatchObject({
        target: {
            kind: "start-session",
            subject: "Accounting"
        },
        title: "Spend 30 minutes on Accounting"
    });
    expect(recommendations[0].score).toBeGreaterThan(recommendations[1].score);
});

test("does not recommend completed planner tasks", () => {
    const recommendations = generateThutoRecommendations(
        {
            plannerTasks: [
                {
                    completed: true,
                    dueDate: "2026-08-20",
                    id: "done",
                    title: "Finished task"
                }
            ]
        },
        now
    );

    expect(recommendations).toEqual([]);
});

test("labels same-day planner deadlines as due today", () => {
    const [recommendation] = generateThutoRecommendations(
        {
            plannerTasks: [
                {
                    completed: false,
                    dueDate: "2026-08-29",
                    id: "today",
                    priority: "Medium",
                    title: "Read chapter"
                }
            ]
        },
        now
    );

    expect(recommendation.reason).toContain("Due today");
});

test("prioritizes a specific struggling concept and keeps its evidence", () => {
    const [recommendation] = generateThutoRecommendations(
        {
            memoryTopics: [
                {
                    concepts: [
                        {
                            correctSignals: 1,
                            id: "limits",
                            label: "Calculus limits",
                            level: "struggling",
                            struggleSignals: 4
                        }
                    ],
                    id: "calculus",
                    level: "struggling",
                    topic: "Calculus"
                }
            ]
        },
        now
    );

    expect(recommendation).toMatchObject({
        actionLabel: "Start focused study",
        evidence: "4 struggle signals · 1 correct",
        id: "concept:calculus:limits",
        subject: "Calculus",
        title: "Review Calculus limits",
        type: "concept",
        weakTopic: true
    });
    expect(recommendation.studyPlan).toMatchObject({
        notes: expect.stringContaining(
            "Learning evidence: 4 struggle signals · 1 correct"
        ),
        priority: "High"
    });
});
