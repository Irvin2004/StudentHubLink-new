import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";

import Switch from "./Switch.jsx";

test("exposes switch semantics and preserves its description", async () => {
    const user = userEvent.setup();
    render(<Switch description="Enable this preference" label="Updates" />);
    const control = screen.getByRole("switch", { name: "Updates" });

    await user.click(control);
    expect(control).toBeChecked();
    expect(control).toHaveAccessibleDescription("Enable this preference");
});
