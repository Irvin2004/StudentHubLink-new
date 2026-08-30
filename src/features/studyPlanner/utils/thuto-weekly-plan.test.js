import { expect, test } from "vitest";

import { generateThutoWeeklyPlan } from "./thuto-weekly-plan.js";

const now = new Date("2026-08-31T10:00:00");

test("builds a seven-day preview around fixed planner workload", () => {
    const plan = generateThutoWeeklyPlan(
        {
            availableMinutes: 300,
            flashcardDecks: [
                {
                    dueCount: 20,
                    id: "deck-1",
                    subject: "Biology",
                    title: "Cells"
                }
            ],
            memoryTopics: [
                {
                    id: "limits",
                    latestQuizPercentage: 45,
                    level: "struggling",
                    topic: "Calculus limits"
                }
            ],
            plannerTasks: [
                {
                    completed: false,
                    dueDate: "2026-08-31",
                    estimatedMinutes: 60,
                    id: "urgent-task",
                    priority: "High",
                    subject: "Calculus",
                    title: "Calculus assignment"
                }
            ],
            quizzes: [
                {
                    attempts: [{ percentage: 50 }],
                    id: "quiz-1",
                    subject: "Biology",
                    title: "Biology Quiz"
                }
            ]
        },
        now
    );

    expect(plan.days).toHaveLength(7);
    expect(plan.blocks).toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                existing: true,
                id: "existing:urgent-task",
                selected: false
            }),
            expect.objectContaining({
                existing: false,
                id: "topic:limits",
                priority: "High",
                selected: true
            }),
            expect.objectContaining({
                flashcardDeckId: "deck-1"
            }),
            expect.objectContaining({ quizId: "quiz-1" })
        ])
    );
    plan.days.forEach((day) => {
        const minutes = day.blocks.reduce(
            (total, block) => total + block.duration,
            0
        );
        expect(minutes).toBeLessThanOrEqual(plan.summary.dailyCap);
    });
});

test("does not duplicate materials that already have active planner tasks", () => {
    const plan = generateThutoWeeklyPlan(
        {
            availableMinutes: 180,
            flashcardDecks: [{ dueCount: 15, id: "deck-1", title: "Cells" }],
            plannerTasks: [
                {
                    completed: false,
                    dueDate: "2026-09-01",
                    estimatedMinutes: 30,
                    flashcardDeckId: "deck-1",
                    id: "cards-task",
                    title: "Review Cells"
                }
            ]
        },
        now
    );

    expect(
        plan.blocks.filter((block) => block.flashcardDeckId === "deck-1")
    ).toHaveLength(1);
    expect(plan.blocks[0].existing).toBe(true);
});

test("uses the remaining weekly time as a hard proposal budget", () => {
    const plan = generateThutoWeeklyPlan(
        {
            availableMinutes: 90,
            memoryTopics: [
                { id: "one", level: "struggling", topic: "Topic one" },
                { id: "two", level: "struggling", topic: "Topic two" }
            ],
            plannerTasks: [
                {
                    completed: false,
                    dueDate: "2026-09-01",
                    estimatedMinutes: 60,
                    id: "existing",
                    title: "Existing task"
                }
            ]
        },
        now
    );

    expect(plan.summary.existingMinutes).toBe(60);
    expect(plan.summary.proposedMinutes).toBe(30);
});
