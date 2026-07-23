import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";

import Menu from "../Menu/index.js";
import Dropdown from "./Dropdown.jsx";

test("opens from its trigger and closes with Escape", async () => {
    const user = userEvent.setup();
    render(
        <Dropdown trigger={<button type="button">Options</button>}>
            <Menu items={[{ id: "one", label: "Option one" }]} />
        </Dropdown>
    );
    const trigger = screen.getByRole("button", { name: "Options" });
    await user.click(trigger);
    expect(screen.getByRole("menu")).toBeVisible();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
});
