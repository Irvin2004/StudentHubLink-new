import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";

import Tooltip from "./Tooltip.jsx";

test("reveals help to keyboard users", async () => {
    const user = userEvent.setup();
    render(
        <Tooltip content="Helpful information">
            <button type="button">Info</button>
        </Tooltip>
    );

    await user.tab();
    expect(screen.getByRole("tooltip")).toHaveTextContent(
        "Helpful information"
    );
    expect(screen.getByRole("button")).toHaveAccessibleDescription(
        "Helpful information"
    );
});
