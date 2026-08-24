import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";

import Input from "./Input.jsx";

test("associates labels and errors and toggles password visibility", async () => {
    const user = userEvent.setup();
    render(
        <Input error="Password is required" label="Password" type="password" />
    );

    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Password is required");
    expect(input).toHaveAttribute("type", "password");
    expect(screen.getByRole("alert")).toHaveTextContent("Password is required");

    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(input).toHaveAttribute("type", "text");
});
