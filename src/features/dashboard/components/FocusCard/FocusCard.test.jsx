import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import {
    FocusCard,
    getFocusTitle,
    getPriorityColor
} from "./FocusCard.jsx";

test("renders the focus card", () => {
    render(
        <FocusCard
            task={{
                id: "robotics-assignment",
                title: "Finish Robotics Assignment",
                subject: "Robotics",
                due: "Tomorrow",
                estimatedTime: "45 min",
                priority: "high",
                progress: 60
            }}
        />
    );

    expect(
        screen.getByRole("heading", { name: "🎯 Today's Focus" })
    ).toBeVisible();
    expect(
        screen.getByRole("heading", { name: "Finish Robotics Assignment" })
    ).toBeVisible();
    expect(screen.getByText("Robotics")).toBeVisible();
    expect(screen.getByText("⏰ Tomorrow")).toBeVisible();
    expect(screen.getByText("⏱ 45 min")).toBeVisible();
    expect(screen.getByText("60%")).toBeVisible();
    expect(screen.getByRole("button", { name: "Continue Learning" })).toBeVisible();
    expect(screen.getByText("HIGH")).toBeVisible();
});

test("emits the task id when continuing", () => {
    const onContinue = vi.fn();

    render(
        <FocusCard
            onContinue={onContinue}
            task={{
                id: "robotics-assignment",
                title: "Finish Robotics Assignment",
                subject: "Robotics",
                due: "Tomorrow",
                estimatedTime: "45 min",
                priority: "high",
                progress: 60
            }}
        />
    );

    fireEvent.click(screen.getByRole("button", { name: "Continue Learning" }));

    expect(onContinue).toHaveBeenCalledWith("robotics-assignment");
});

test("shows loading skeletons", () => {
    const { container } = render(<FocusCard loading />);

    expect(container.querySelectorAll("[data-skeleton]").length).toBe(6);
});

test("shows the empty state", () => {
    const onBrowseResources = vi.fn();

    render(<FocusCard onBrowseResources={onBrowseResources} />);

    expect(
        screen.getByRole("heading", { name: "You're all caught up!" })
    ).toBeVisible();
    expect(screen.getByText("No focus task for today.")).toBeVisible();
    expect(
        screen.getByRole("button", { name: "Browse Resources" })
    ).toBeVisible();
});

test("maps priority and titles", () => {
    expect(getPriorityColor("high")).toBe("danger");
    expect(getPriorityColor("medium")).toBe("warning");
    expect(getPriorityColor("low")).toBe("success");
    expect(getPriorityColor("anything else")).toBe("neutral");

    expect(getFocusTitle({ type: "resource" })).toBe("📚 Continue Learning");
    expect(getFocusTitle({ type: "quiz" })).toBe("⚡ Next Priority");
    expect(getFocusTitle({ type: "assignment" })).toBe("🎯 Today's Focus");
    expect(getFocusTitle({})).toBe("🎯 Today's Focus");
});
