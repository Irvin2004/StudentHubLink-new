import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { StatsGrid } from "./StatsGrid.jsx";

test("renders the four dashboard stats", () => {
    render(
        <StatsGrid
            stats={{
                assignments: 3,
                communities: 8,
                messages: 12,
                resources: 42
            }}
        />
    );

    expect(screen.getByRole("heading", { name: "Communities" })).toBeVisible();
    expect(screen.getByText("8")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Resources" })).toBeVisible();
    expect(screen.getByText("42")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Messages" })).toBeVisible();
    expect(screen.getByText("12")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Assignments" })).toBeVisible();
    expect(screen.getByText("3")).toBeVisible();
});
