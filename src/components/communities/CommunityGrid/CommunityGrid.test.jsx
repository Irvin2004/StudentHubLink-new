import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import CommunityGrid from "./CommunityGrid.jsx";

describe("CommunityGrid", () => {
    test("shows the reusable empty state and create action", async () => {
        const onCreate = vi.fn();
        const user = userEvent.setup();

        render(
            <CommunityGrid
                communities={[]}
                createAction={{
                    label: "Create community",
                    onClick: onCreate
                }}
            />
        );

        expect(
            screen.getByRole("heading", { name: "No communities found" })
        ).toBeInTheDocument();

        await user.click(
            screen.getByRole("button", { name: "Create community" })
        );
        expect(onCreate).toHaveBeenCalledOnce();
    });
});
