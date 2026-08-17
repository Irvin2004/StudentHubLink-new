import { expect, test } from "vitest";

import {
    formatStudyTime,
    getDueGroup,
    getDueLabel,
    getDueStatusLabel,
    isDateKey,
    sortTasksByDueDate
} from "./task-grouping.js";

test("groups tasks into overdue, today, tomorrow, this week, and later", () => {
    const wednesday = new Date(2026, 7, 5, 12);

    expect(getDueGroup("2026-08-04", wednesday)).toBe("overdue");
    expect(getDueGroup("2026-08-05", wednesday)).toBe("today");
    expect(getDueGroup("2026-08-06", wednesday)).toBe("tomorrow");
    expect(getDueGroup("2026-08-09", wednesday)).toBe("week");
    expect(getDueGroup("2026-08-10", wednesday)).toBe("later");
    expect(getDueGroup("2026-08-04", wednesday, true)).toBe("completed");

    expect(getDueLabel("overdue")).toBe("Overdue");
    expect(getDueLabel("week")).toBe("This Week");
    expect(getDueLabel("later")).toBe("Later");
});

test("formats estimated study time summaries", () => {
    expect(formatStudyTime(0)).toBe("0m");
    expect(formatStudyTime(45)).toBe("45m");
    expect(formatStudyTime(180)).toBe("3h");
    expect(formatStudyTime(225)).toBe("3h 45m");
});

test("formats friendly due-date status labels", () => {
    const today = new Date(2026, 7, 5, 12);

    expect(getDueStatusLabel("2026-08-05", today)).toBe("Due today");
    expect(getDueStatusLabel("2026-08-06", today)).toBe("Due tomorrow");
    expect(getDueStatusLabel("2026-08-08", today)).toBe("Due in 3 days");
    expect(getDueStatusLabel("2026-08-04", today)).toBe("1 day overdue");
    expect(getDueStatusLabel("2026-08-03", today)).toBe("2 days overdue");
});

test("rejects malformed task dates without rendering NaN overdue labels", () => {
    const today = new Date(2026, 7, 17, 12);

    expect(isDateKey("2026-08-17")).toBe(true);
    expect(isDateKey("2026-02-30")).toBe(false);
    expect(isDateKey("")).toBe(false);
    expect(getDueGroup("", today)).toBe("later");
    expect(getDueStatusLabel("", today)).toBe("No due date");
});

test("sorts tasks by earliest due date without mutating the source", () => {
    const tasks = [
        { id: "third", dueDate: "2026-08-12" },
        { id: "first", dueDate: "2026-08-05" },
        { id: "second", dueDate: "2026-08-08" }
    ];

    expect(sortTasksByDueDate(tasks).map((task) => task.id)).toEqual([
        "first",
        "second",
        "third"
    ]);
    expect(tasks.map((task) => task.id)).toEqual(["third", "first", "second"]);
});
