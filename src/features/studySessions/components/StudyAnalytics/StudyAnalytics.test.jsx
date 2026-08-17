import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { StudyAnalytics } from "./StudyAnalytics.jsx";

const analytics = {
    averageSessionMinutes: 37,
    dailyBreakdown: [
        { date: "2026-08-10", day: "Mon", minutes: 45 },
        { date: "2026-08-11", day: "Tue", minutes: 60 },
        { date: "2026-08-12", day: "Wed", minutes: 30 },
        { date: "2026-08-13", day: "Thu", minutes: 75 },
        { date: "2026-08-14", day: "Fri", minutes: 10 },
        { date: "2026-08-15", day: "Sat", minutes: 0 },
        { date: "2026-08-16", day: "Sun", minutes: 0 }
    ],
    longestSessionMinutes: 75,
    streak: { current: 4, longest: 4, progress: 57 },
    subjectBreakdown: [
        { minutes: 130, subject: "Programming" },
        { minutes: 60, subject: "Robotics" },
        { minutes: 30, subject: "Database" }
    ],
    weeklyGoalMinutes: 300,
    weeklyMinutes: 220,
    weeklyProgress: 73
};

test("renders weekly, daily, subject, and session analytics", () => {
    render(<StudyAnalytics analytics={analytics} />);

    expect(
        screen.getByRole("heading", { name: "Study Analytics" })
    ).toBeVisible();
    expect(screen.getByText("3h 40m / 5h")).toBeVisible();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
        "aria-valuenow",
        "73"
    );
    expect(screen.getByText("Programming")).toBeVisible();
    expect(screen.getByText("2h 10m")).toBeVisible();

    const metrics = screen.getByText("Average Session").closest("dl");
    expect(within(metrics).getByText("37m")).toBeVisible();
    expect(within(metrics).getByText("1h 15m")).toBeVisible();
    expect(within(metrics).getByText("4 days")).toBeVisible();
});

test("shows an empty state before a session is completed", () => {
    render(
        <StudyAnalytics
            analytics={{
                ...analytics,
                averageSessionMinutes: 0,
                longestSessionMinutes: 0,
                subjectBreakdown: [],
                weeklyMinutes: 0,
                weeklyProgress: 0
            }}
        />
    );

    expect(screen.getByText("No study analytics yet")).toBeVisible();
});

test("updates the persisted weekly goal from an accessible control", () => {
    const onUpdateWeeklyGoal = vi.fn();
    render(
        <StudyAnalytics
            analytics={analytics}
            onUpdateWeeklyGoal={onUpdateWeeklyGoal}
        />
    );

    fireEvent.change(screen.getByLabelText("Weekly study goal"), {
        target: { value: "480" }
    });
    expect(onUpdateWeeklyGoal).toHaveBeenCalledWith(480);
});
