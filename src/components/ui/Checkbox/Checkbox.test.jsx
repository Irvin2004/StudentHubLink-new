import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";

import Checkbox from "./Checkbox.jsx";

test("toggles with pointer and keyboard input", async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Remember me" />);
    const checkbox = screen.getByRole("checkbox", { name: "Remember me" });

    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    checkbox.focus();
    await user.keyboard(" ");
    expect(checkbox).not.toBeChecked();
});
