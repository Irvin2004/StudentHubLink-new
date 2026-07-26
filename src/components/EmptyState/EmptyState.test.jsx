import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import EmptyState from "./EmptyState.jsx";

describe("EmptyState", () => {
    test("renders its title, description, and decorative illustration", () => {
        render(
            <EmptyState
                description="Browse communities and join one to get started."
                illustration="communities"
                title="No communities yet"
            />
        );

        const heading = screen.getByRole("heading", {
            name: "No communities yet"
        });
        expect(heading).toBeVisible();
        expect(
            screen.getByText("Browse communities and join one to get started.")
        ).toBeVisible();
        expect(heading.closest("section")).toHaveAttribute(
            "aria-labelledby",
            heading.id
        );
        expect(document.querySelector("img")).toHaveAttribute("alt", "");
    });

    test("renders and invokes an optional action", async () => {
        const onAction = vi.fn();
        const user = userEvent.setup();
        render(
            <EmptyState
                actionLabel="Browse Communities"
                description="Find a community."
                onAction={onAction}
                title="No communities yet"
            />
        );

        await user.click(
            screen.getByRole("button", { name: "Browse Communities" })
        );
        expect(onAction).toHaveBeenCalledOnce();
    });

    test("does not render a button without a complete action", () => {
        render(
            <EmptyState
                actionLabel="Unavailable action"
                description="Nothing to show."
                title="Empty"
            />
        );

        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
});
