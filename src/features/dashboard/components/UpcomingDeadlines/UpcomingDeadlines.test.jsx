import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { UpcomingDeadlines } from "./UpcomingDeadlines.jsx";
import { DeadlineCard } from "./DeadlineCard.jsx";

const deadlines = [
    {
        id: "python-project",
        title: "Python Project",
        subject: "Programming",
        due: "Tomorrow",
        priority: "high"
    },
    {
        id: "robotics-practical",
        title: "Robotics Practical",
        subject: "Robotics",
        due: "Friday",
        priority: "medium"
    },
    {
        id: "database-assignment",
        title: "Database Assignment",
        subject: "Database",
        due: "Next Monday",
        priority: "low"
    }
];

test("renders the deadlines widget", () => {
    render(<UpcomingDeadlines deadlines={deadlines} />);

    expect(
        screen.getByRole("heading", { name: "📅 Upcoming Deadlines" })
    ).toBeVisible();
    expect(screen.getByText("Python Project")).toBeVisible();
    expect(screen.getByText("Robotics Practical")).toBeVisible();
    expect(screen.getByText("Database Assignment")).toBeVisible();
    expect(screen.getAllByRole("button", { name: "Open" })).toHaveLength(3);
});

test("opens the selected assignment", () => {
    const onOpenAssignment = vi.fn();

    render(
        <UpcomingDeadlines
            deadlines={deadlines}
            onOpenAssignment={onOpenAssignment}
        />
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Open" })[0]);

    expect(onOpenAssignment).toHaveBeenCalledWith("python-project");
});

test("shows loading skeleton cards", () => {
    const { container } = render(<UpcomingDeadlines loading />);

    expect(container.querySelectorAll("[data-skeleton]").length).toBe(12);
});

test("shows the empty state", () => {
    render(
        <UpcomingDeadlines
            deadlines={[]}
            onBrowseResources={vi.fn()}
        />
    );

    expect(
        screen.getByRole("heading", { name: "No Upcoming Deadlines" })
    ).toBeVisible();
    expect(
        screen.getByRole("button", { name: "Browse Resources" })
    ).toBeVisible();
});

test("renders a deadline card", () => {
    render(
        <DeadlineCard
            due="Tomorrow"
            onOpen={vi.fn()}
            priority="high"
            subject="Programming"
            title="Python Project"
        />
    );

    expect(screen.getByText("Python Project")).toBeVisible();
    expect(screen.getByText("Programming")).toBeVisible();
    expect(screen.getByText("Due Tomorrow")).toBeVisible();
    expect(screen.getByRole("button", { name: "Open" })).toBeVisible();
});
