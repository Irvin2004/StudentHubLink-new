import { useRef, useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MobileDrawer } from "./MobileDrawer.jsx";

function DrawerHarness() {
    const [open, setOpen] = useState(false);
    const menuButtonRef = useRef(null);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                ref={menuButtonRef}
                type="button"
            >
                Menu
            </button>
            <MobileDrawer
                onClose={() => setOpen(false)}
                open={open}
                returnFocusRef={menuButtonRef}
            >
                <a href="/app">Home</a>
            </MobileDrawer>
            <input aria-label="Background search" />
        </>
    );
}

describe("MobileDrawer", () => {
    beforeEach(() => {
        vi.spyOn(window, "matchMedia").mockReturnValue({
            addEventListener: vi.fn(),
            matches: true,
            media: "(max-width: 767px)",
            removeEventListener: vi.fn()
        });
    });

    it("closes with Escape and restores focus to the menu button", async () => {
        const user = userEvent.setup();

        render(<DrawerHarness />);

        await user.tab();
        await user.keyboard("{Enter}");

        await waitFor(() =>
            expect(
                screen.getByRole("button", { name: "Close navigation" })
            ).toHaveFocus()
        );

        await user.keyboard("{Escape}");

        await waitFor(() =>
            expect(screen.getByRole("button", { name: "Menu" })).toHaveFocus()
        );
        expect(
            screen.getByRole("complementary", { hidden: true })
        ).toHaveAttribute("aria-hidden", "true");
    });

    it("wraps Tab in both directions and recovers focus from outside", async () => {
        const user = userEvent.setup();
        render(<DrawerHarness />);
        await user.click(screen.getByRole("button", { name: "Menu" }));

        const close = screen.getByRole("button", { name: "Close navigation" });
        const home = screen.getByRole("link", { name: "Home" });
        expect(close).toHaveFocus();
        await user.tab({ shift: true });
        expect(home).toHaveFocus();
        await user.tab();
        expect(close).toHaveFocus();
        await user.tab();
        expect(home).toHaveFocus();

        screen.getByRole("textbox", { name: "Background search" }).focus();
        await user.tab();
        expect(close).toHaveFocus();
        screen.getByRole("textbox", { name: "Background search" }).focus();
        await user.tab({ shift: true });
        expect(home).toHaveFocus();

        await user.click(close);
        expect(screen.getByRole("button", { name: "Menu" })).toHaveFocus();
        await user.keyboard(" ");
        expect(close).toHaveFocus();
        await user.keyboard("{Escape}");
        expect(screen.getByRole("button", { name: "Menu" })).toHaveFocus();
    });
});
