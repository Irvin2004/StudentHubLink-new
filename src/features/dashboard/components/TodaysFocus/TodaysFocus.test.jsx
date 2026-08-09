import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { TodaysFocus } from "./TodaysFocus.jsx";

test("renders the focus task", () => {
    render(
        <TodaysFocus
            onBrowseResources={vi.fn()}
            onContinue={vi.fn()}
            task={{
                due: "Tomorrow",
                estimatedTime: "45 min",
                priority: "High",
                title: "Finish Robotics Assignment"
            }}
        />
    );

    expect(
        screen.getByRole("heading", { name: "Today's Focus" })
    ).toBeVisible();
    expect(
        screen.getByRole("heading", { name: "Finish Robotics Assignment" })
    ).toBeVisible();
    expect(screen.getByText("Due")).toBeVisible();
    expect(screen.getByText("Tomorrow")).toBeVisible();
    expect(screen.getByText("Estimated Time")).toBeVisible();
    expect(screen.getByText("45 min")).toBeVisible();
    expect(screen.getByText("High")).toBeVisible();
    expect(screen.getByRole("button", { name: "Continue" })).toBeVisible();
});

test("shows loading skeletons", () => {
    const { container } = render(<TodaysFocus loading />);

    expect(container.querySelectorAll("[data-skeleton]").length).toBe(4);
});

test("shows the empty state", () => {
    render(
        <TodaysFocus
            onBrowseResources={vi.fn()}
            onContinue={vi.fn()}
            task={null}
        />
    );

    expect(
        screen.getByRole("heading", { name: "You're all caught up!" })
    ).toBeVisible();
    expect(
        screen.getByRole("button", { name: "Browse Resources" })
    ).toBeVisible();
});
