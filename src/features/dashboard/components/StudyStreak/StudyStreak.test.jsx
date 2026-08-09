import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { StudyStreak, getStreakMessage } from "./StudyStreak.jsx";

test("renders the streak card", () => {
    render(
        <StudyStreak
            streak={{
                current: 12,
                longest: 25,
                progress: 80
            }}
        />
    );

    expect(
        screen.getByRole("heading", { name: "Study Streak" })
    ).toBeVisible();
    expect(screen.getByText("12 Days")).toBeVisible();
    expect(screen.getByText("You're building a great habit!")).toBeVisible();
    expect(screen.getByText("80%")).toBeVisible();
    expect(screen.getByText("Longest Streak: 25 Days")).toBeVisible();
});

test("shows loading skeletons", () => {
    const { container } = render(<StudyStreak loading />);

    expect(container.querySelectorAll("[data-skeleton]").length).toBe(5);
});

test("shows the empty state", () => {
    render(<StudyStreak streak={null} onStart={vi.fn()} />);

    expect(
        screen.getByRole("heading", { name: "No Study Streak Yet" })
    ).toBeVisible();
    expect(
        screen.getByRole("button", { name: "Start Studying" })
    ).toBeVisible();
});

test("maps streaks to the right message", () => {
    expect(getStreakMessage(0)).toBe("Start your learning journey today!");
    expect(getStreakMessage(3)).toBe("Great start! Keep going!");
    expect(getStreakMessage(14)).toBe("You're building a great habit!");
    expect(getStreakMessage(30)).toBe("Amazing consistency! Keep it up!");
});
