import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { StatsGrid } from "./StatsGrid.jsx";

test("renders dashboard stats including due flashcards", () => {
    render(
        <StatsGrid
            stats={{
                communities: 8,
                messages: 12,
                resources: 42,
                tasks: 3,
                dueFlashcards: 7,
                recentQuizScore: 80,
                weakQuizTopics: 2
            }}
        />
    );

    expect(screen.getByRole("heading", { name: "Communities" })).toBeVisible();
    expect(screen.getByText("8")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Resources" })).toBeVisible();
    expect(screen.getByText("42")).toBeVisible();
    expect(
        screen.getByRole("heading", { name: "Unread Messages" })
    ).toBeVisible();
    expect(screen.getByText("12")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Tasks" })).toBeVisible();
    expect(screen.getByText("3")).toBeVisible();
    expect(
        screen.getByRole("heading", { name: "Due Flashcards" })
    ).toBeVisible();
    expect(screen.getByText("7")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Recent Quiz" })).toBeVisible();
    expect(screen.getByText("80%")).toBeVisible();
    expect(
        screen.getByRole("heading", { name: "Weak Quiz Topics" })
    ).toBeVisible();
});

test("shows skeletons instead of a zero task count while loading", () => {
    const { container } = render(
        <StatsGrid
            loading
            stats={{ communities: 0, messages: 0, resources: 0, tasks: 0 }}
        />
    );

    expect(container.querySelectorAll("[data-skeleton]").length).toBe(21);
    expect(screen.queryByText("0")).not.toBeInTheDocument();
});

test("uses the shared load-error state", () => {
    render(<StatsGrid error={new Error("Failed")} onRetry={vi.fn()} />);

    expect(
        screen.getByRole("heading", { name: "Stats unavailable" })
    ).toBeVisible();
});
