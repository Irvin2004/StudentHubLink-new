import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";

import IconButton from "./IconButton.jsx";

test("requires a label and activates from the keyboard", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
        <IconButton aria-label="Add item" onClick={onClick}>
            +
        </IconButton>
    );

    screen.getByRole("button", { name: "Add item" }).focus();
    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledOnce();
});
