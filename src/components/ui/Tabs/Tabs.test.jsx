import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";

import Tabs from "./Tabs.jsx";

test("switches panels with clicks and arrow keys", async () => {
    const user = userEvent.setup();
    render(
        <Tabs
            items={[
                { content: "First panel", id: "first", label: "First" },
                { content: "Second panel", id: "second", label: "Second" }
            ]}
        />
    );
    const first = screen.getByRole("tab", { name: "First" });
    first.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Second" })).toHaveAttribute(
        "aria-selected",
        "true"
    );
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Second panel");
});
