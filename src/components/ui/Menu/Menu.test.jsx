import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";

import Menu from "./Menu.jsx";

test("supports arrow navigation and selection", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
        <Menu
            items={[
                { id: "edit", label: "Edit" },
                { id: "delete", label: "Delete" }
            ]}
            onSelect={onSelect}
        />
    );
    const edit = screen.getByRole("menuitem", { name: "Edit" });
    edit.focus();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveFocus();
    expect(onSelect).toHaveBeenCalledWith("delete");
});
