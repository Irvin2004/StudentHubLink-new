import { render, screen, within } from "@testing-library/react";
import { expect, test } from "vitest";

import { WeeklyProgress } from "./WeeklyProgress.jsx";

test("shows progress and workload summaries", () => {
    render(
        <WeeklyProgress
            activeStudyMinutes={225}
            completedTasks={3}
            todayStudyMinutes={90}
            totalTasks={5}
            weeklyGoalMinutes={300}
            weeklyMinutes={180}
            weeklyProgress={60}
        />
    );

    const summary = screen.getByLabelText("Progress summary");
    expect(within(summary).getByText("Total tasks")).toBeVisible();
    expect(within(summary).getByText("Completed")).toBeVisible();
    expect(within(summary).getByText("3")).toBeVisible();
    expect(within(summary).getByText("5")).toBeVisible();
    expect(within(summary).getByText(/60% of weekly study goal/)).toBeVisible();
    expect(within(summary).getByText(/2 active/)).toBeVisible();
    expect(within(summary).getByText("3h 45m remaining")).toBeVisible();
    expect(within(summary).getByText("1h 30m")).toBeVisible();
    expect(within(summary).getByText("3h / 5h")).toBeVisible();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
        "aria-valuenow",
        "60"
    );
});
