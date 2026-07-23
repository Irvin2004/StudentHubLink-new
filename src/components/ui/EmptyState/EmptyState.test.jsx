import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";

import EmptyState from "./EmptyState.jsx";

test("announces its title and supports an optional action", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
        <EmptyState
            action={{ label: "Try again", onClick }}
            description="Adjust your filters."
            title="No results"
        />
    );
    expect(screen.getByRole("heading", { name: "No results" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(onClick).toHaveBeenCalledOnce();
});
