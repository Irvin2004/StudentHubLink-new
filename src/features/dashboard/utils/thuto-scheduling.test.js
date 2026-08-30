import { expect, test } from "vitest";

import { suggestThutoStudySchedule } from "./thuto-scheduling.js";

const now = new Date("2026-08-30T10:00:00");

test("suggests a lighter planner day before the deadline", () => {
    const recommendation = {
        dueDate: "2026-09-02",
        quizId: "quiz-1",
        reason: "Latest score was 55%",
        subject: "Biology",
        taskType: "quiz",
        title: "Retake Biology Quiz 2",
        type: "quiz",
        weakTopic: true
    };
    const tasks = [
        {
            completed: false,
            dueDate: "2026-08-30",
            estimatedMinutes: 120,
            priority: "High"
        },
        {
            completed: false,
            dueDate: "2026-08-31",
            estimatedMinutes: 90,
            priority: "High"
        }
    ];

    const suggestion = suggestThutoStudySchedule(recommendation, tasks, now);

    expect(suggestion).toMatchObject({
        dueDate: "2026-09-01",
        estimatedMinutes: 30,
        priority: "High",
        quizId: "quiz-1",
        subject: "Biology",
        taskType: "quiz"
    });
    expect(suggestion.advisoryReason).toContain("before the 2026-09-02");
});

test("does not mutate the existing planner while producing advice", () => {
    const task = Object.freeze({
        completed: false,
        dueDate: "2026-08-30",
        estimatedMinutes: 30,
        priority: "Medium"
    });
    const tasks = Object.freeze([task]);

    suggestThutoStudySchedule(
        {
            reason: "This topic needs review",
            subject: "Accounting",
            title: "Review Accounting",
            type: "topic",
            weakTopic: true
        },
        tasks,
        now
    );

    expect(tasks).toEqual([task]);
});
