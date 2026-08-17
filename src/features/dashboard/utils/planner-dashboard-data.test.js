import { afterEach, expect, test, vi } from "vitest";

import { getPlannerDashboardData } from "./planner-dashboard-data.js";

afterEach(() => {
    vi.useRealTimers();
});

test("derives focus, deadlines, task count, and progress from planner tasks", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 9, 12));

    const result = getPlannerDashboardData([
        {
            id: "medium-soon",
            title: "Medium soon",
            subject: "Science",
            dueDate: "2026-08-10",
            estimatedMinutes: 30,
            priority: "Medium",
            completed: false
        },
        {
            id: "high-later",
            title: "High later",
            subject: "Mathematics",
            dueDate: "2026-08-12",
            estimatedMinutes: 90,
            priority: "High",
            completed: false
        },
        {
            id: "high-sooner",
            title: "High sooner",
            subject: "Programming",
            dueDate: "2026-08-11",
            estimatedMinutes: 45,
            priority: "High",
            completed: false
        },
        {
            id: "low-latest",
            title: "Low latest",
            subject: "English",
            dueDate: "2026-08-20",
            estimatedMinutes: 25,
            priority: "Low",
            completed: false
        },
        {
            id: "completed",
            title: "Completed task",
            subject: "History",
            dueDate: "2026-08-09",
            estimatedMinutes: 20,
            priority: "High",
            completed: true
        }
    ]);

    expect(result.activeTaskCount).toBe(4);
    expect(result.weeklyProgress).toBe(20);
    expect(result.focusTask).toEqual(
        expect.objectContaining({
            id: "high-sooner",
            due: "Due in 2 days",
            estimatedTime: "45m"
        })
    );
    expect(result.deadlines.map((task) => task.id)).toEqual([
        "medium-soon",
        "high-sooner",
        "high-later"
    ]);
    expect(result.deadlines.map((task) => task.id)).not.toContain("completed");
    expect(result.deadlines.map((task) => task.id)).not.toContain("low-latest");
});

test("returns an empty planner summary when there are no tasks", () => {
    expect(getPlannerDashboardData([])).toEqual({
        activeTaskCount: 0,
        deadlines: [],
        focusTask: null,
        weeklyProgress: 0
    });
});

test("returns empty active-task widgets when every task is completed", () => {
    const result = getPlannerDashboardData([
        {
            id: "completed-task",
            title: "Completed task",
            subject: "History",
            dueDate: "2026-08-09",
            estimatedMinutes: 30,
            priority: "High",
            completed: true
        }
    ]);

    expect(result.focusTask).toBeNull();
    expect(result.deadlines).toEqual([]);
    expect(result.activeTaskCount).toBe(0);
    expect(result.weeklyProgress).toBe(100);
});
