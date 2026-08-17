import { expect, test } from "vitest";

import {
    normalizePlannerTask,
    selectActiveStudyMinutes,
    selectActiveTaskCount,
    selectFocusTask,
    selectPlannerProgress,
    selectTodayStudyMinutes,
    selectUpcomingTasks
} from "./planner-selectors.js";

const tasks = [
    {
        id: "medium-today",
        dueDate: "2026-08-09",
        estimatedMinutes: 30,
        priority: "Medium",
        completed: false
    },
    {
        id: "high-later",
        dueDate: "2026-08-11",
        estimatedMinutes: 60,
        priority: "High",
        completed: false
    },
    {
        id: "high-sooner",
        dueDate: "2026-08-10",
        estimatedMinutes: 45,
        priority: "High",
        completed: false
    },
    {
        id: "completed",
        dueDate: "2026-08-08",
        estimatedMinutes: 20,
        priority: "High",
        completed: true
    }
];

test("selects focus by priority first and nearest due date second", () => {
    expect(selectFocusTask(tasks)?.id).toBe("high-sooner");
});

test("selects active upcoming tasks and shared summary values", () => {
    expect(selectUpcomingTasks(tasks).map((task) => task.id)).toEqual([
        "medium-today",
        "high-sooner",
        "high-later"
    ]);
    expect(selectActiveTaskCount(tasks)).toBe(3);
    expect(selectPlannerProgress(tasks)).toBe(25);
    expect(selectActiveStudyMinutes(tasks)).toBe(135);
    expect(selectTodayStudyMinutes(tasks, new Date(2026, 7, 9, 12))).toBe(30);
});

test("normalizes planner grouping and urgency with the shared rules", () => {
    expect(normalizePlannerTask(tasks[2], new Date(2026, 7, 9, 12))).toEqual(
        expect.objectContaining({
            dueGroup: "tomorrow",
            dueLabel: "Tomorrow",
            dueStatus: "Due tomorrow",
            estimatedTime: "45 min"
        })
    );
});
