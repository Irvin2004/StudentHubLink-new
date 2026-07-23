import { useRef, useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MobileDrawer } from "./MobileDrawer.jsx";

function DrawerHarness() {
    const [open, setOpen] = useState(true);
    const menuButtonRef = useRef(null);

    return (
        <>
            <button ref={menuButtonRef} type="button">
                Menu
            </button>
            <MobileDrawer
                onClose={() => setOpen(false)}
                open={open}
                returnFocusRef={menuButtonRef}
            >
                <a href="/app">Home</a>
            </MobileDrawer>
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
});
