import { expect, test } from "vitest";

import {
    formatSessionTimer,
    formatStudyMinutes,
    filterStudySessions,
    isQualifyingStudySession,
    secondsToStudyMinutes,
    selectAverageSessionMinutes,
    selectDailyStudyBreakdown,
    selectLongestSessionMinutes,
    selectStudyAnalytics,
    selectStudyStreak,
    selectSubjectStudyBreakdown,
    selectWeeklyGoalProgress,
    selectWeeklyStudyMinutes
} from "./study-session-selectors.js";

test("totals only completed sessions in the current week", () => {
    const now = new Date("2026-08-12T12:00:00");
    const sessions = [
        { actualMinutes: 45, completedAt: new Date("2026-08-10T09:00:00") },
        { actualMinutes: 30, completedAt: new Date("2026-08-12T10:00:00") },
        { actualMinutes: 90, completedAt: new Date("2026-08-09T18:00:00") }
    ];

    expect(selectWeeklyStudyMinutes(sessions, now)).toBe(75);
    expect(selectWeeklyGoalProgress(sessions, now, 300)).toBe(25);
});

test("derives current and longest streaks from unique completion days", () => {
    const sessions = [
        { actualMinutes: 1, completedAt: new Date("2026-08-10T10:00:00") },
        { actualMinutes: 1, completedAt: new Date("2026-08-11T10:00:00") },
        { actualMinutes: 1, completedAt: new Date("2026-08-11T15:00:00") },
        { actualMinutes: 1, completedAt: new Date("2026-08-12T10:00:00") }
    ];

    expect(
        selectStudyStreak(sessions, new Date("2026-08-12T20:00:00"))
    ).toEqual({
        current: 3,
        longest: 3,
        progress: 43
    });
});

test("formats timer and recorded study duration", () => {
    expect(formatSessionTimer(1938)).toBe("00:32:18");
    expect(secondsToStudyMinutes(65)).toBe(1);
    expect(formatStudyMinutes(225)).toBe("3h 45m");
});

test("builds a Monday-to-Sunday daily breakdown for the current week", () => {
    const sessions = [
        { actualMinutes: 45, completedAt: new Date("2026-08-10T09:00:00") },
        { actualMinutes: 20, completedAt: new Date("2026-08-10T14:00:00") },
        { actualMinutes: 60, completedAt: new Date("2026-08-11T10:00:00") }
    ];

    const breakdown = selectDailyStudyBreakdown(
        sessions,
        new Date("2026-08-12T12:00:00")
    );

    expect(breakdown).toHaveLength(7);
    expect(breakdown.map(({ minutes }) => minutes)).toEqual([
        65, 60, 0, 0, 0, 0, 0
    ]);
});

test("groups current-week study time by subject", () => {
    const sessions = [
        {
            actualMinutes: 60,
            completedAt: new Date("2026-08-10T09:00:00"),
            subject: "Robotics"
        },
        {
            actualMinutes: 90,
            completedAt: new Date("2026-08-11T09:00:00"),
            subject: "Programming"
        },
        {
            actualMinutes: 40,
            completedAt: new Date("2026-08-09T09:00:00"),
            subject: "Programming"
        }
    ];

    expect(
        selectSubjectStudyBreakdown(sessions, new Date("2026-08-12T12:00:00"))
    ).toEqual([
        { minutes: 90, subject: "Programming" },
        { minutes: 60, subject: "Robotics" }
    ]);
});

test("derives average, longest, and the full analytics summary", () => {
    const sessions = [
        {
            actualMinutes: 30,
            completedAt: new Date("2026-08-10T09:00:00"),
            subject: "Database"
        },
        {
            actualMinutes: 75,
            completedAt: new Date("2026-08-11T09:00:00"),
            subject: "Programming"
        }
    ];

    expect(selectAverageSessionMinutes(sessions)).toBe(53);
    expect(selectLongestSessionMinutes(sessions)).toBe(75);
    expect(
        selectStudyAnalytics(sessions, new Date("2026-08-12T12:00:00"), 300)
    ).toEqual(
        expect.objectContaining({
            averageSessionMinutes: 53,
            longestSessionMinutes: 75,
            weeklyGoalMinutes: 300,
            weeklyMinutes: 105,
            weeklyProgress: 35
        })
    );
});

test("filters study history by subject and completion date", () => {
    const sessions = [
        {
            id: "robotics",
            completedAt: new Date("2026-08-10T09:00:00"),
            subject: "Robotics"
        },
        {
            id: "programming",
            completedAt: new Date("2026-08-11T09:00:00"),
            subject: "Programming"
        }
    ];

    expect(
        filterStudySessions(sessions, {
            date: "2026-08-10",
            subject: "Robotics"
        }).map(({ id }) => id)
    ).toEqual(["robotics"]);
});

test("excludes accidental short sessions from every analytics total", () => {
    const sessions = [
        {
            actualMinutes: 1,
            completedAt: new Date("2026-08-10T09:00:00"),
            durationSeconds: 5,
            subject: "Robotics"
        },
        {
            actualMinutes: 1,
            completedAt: new Date("2026-08-11T09:00:00"),
            durationSeconds: 60,
            subject: "Programming"
        }
    ];
    const now = new Date("2026-08-11T12:00:00");

    expect(isQualifyingStudySession(sessions[0])).toBe(false);
    expect(selectWeeklyStudyMinutes(sessions, now)).toBe(1);
    expect(selectSubjectStudyBreakdown(sessions, now)).toEqual([
        { minutes: 1, subject: "Programming" }
    ]);
    expect(selectStudyStreak(sessions, now).current).toBe(1);
    expect(selectAverageSessionMinutes(sessions)).toBe(1);
});

test("handles Sunday-to-Monday and month boundaries consistently", () => {
    const sessions = [
        {
            actualMinutes: 30,
            completedAt: new Date("2026-05-31T20:00:00"),
            durationSeconds: 1800
        },
        {
            actualMinutes: 45,
            completedAt: new Date("2026-06-01T09:00:00"),
            durationSeconds: 2700
        },
        {
            actualMinutes: 60,
            completedAt: new Date("2026-06-07T18:00:00"),
            durationSeconds: 3600
        },
        {
            actualMinutes: 90,
            completedAt: new Date("2026-06-08T09:00:00"),
            durationSeconds: 5400
        }
    ];

    expect(
        selectWeeklyStudyMinutes(sessions, new Date("2026-06-07T21:00:00"))
    ).toBe(105);
    expect(
        selectStudyStreak(sessions.slice(0, 2), new Date("2026-06-01T12:00:00"))
            .current
    ).toBe(2);
});
