import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { Sidebar } from "./Sidebar.jsx";

describe("Sidebar", () => {
    it("exposes active state and arrow-key navigation", async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter initialEntries={["/app"]}>
                <Sidebar />
            </MemoryRouter>
        );

        const home = screen.getByRole("link", { name: "Home" });
        const discover = screen.getByRole("link", { name: "Discover" });
        const communities = screen.getByRole("link", {
            name: "Communities"
        });

        expect(home).toHaveAttribute("aria-current", "page");

        home.focus();
        await user.keyboard("{ArrowDown}");
        expect(discover).toHaveFocus();
        await user.keyboard("{ArrowDown}");
        expect(communities).toHaveFocus();

        await user.keyboard(" ");
        expect(communities).toHaveAttribute("aria-current", "page");
    });
});
