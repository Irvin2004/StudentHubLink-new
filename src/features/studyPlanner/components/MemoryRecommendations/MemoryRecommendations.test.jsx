import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { MemoryRecommendations } from "./MemoryRecommendations.jsx";

test("shows learning evidence and opens an editable scheduling step", () => {
    const onSchedule = vi.fn();
    const recommendation = {
        evidence: "4 struggle signals · 1 correct",
        id: "limits",
        reason: "Saved Calculus practice shows limits need review.",
        studyPlan: {
            dueDate: "2026-09-06",
            estimatedMinutes: 30,
            priority: "High"
        },
        subject: "Calculus",
        title: "Review limits"
    };
    render(
        <MemoryRecommendations
            onSchedule={onSchedule}
            recommendations={[recommendation]}
        />
    );

    expect(screen.getByText("What to study next")).toBeVisible();
    expect(screen.getByText("4 struggle signals · 1 correct")).toBeVisible();
    fireEvent.click(
        screen.getByRole("button", { name: "Review and schedule" })
    );
    expect(onSchedule).toHaveBeenCalledWith(recommendation);
});
