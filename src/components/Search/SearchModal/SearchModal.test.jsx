import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SearchModal from "./SearchModal.jsx";

const search = vi.hoisted(() => ({
    activateResult: vi.fn(),
    activeFilter: "all",
    activeIndex: -1,
    clearSearch: vi.fn(),
    error: "",
    loading: false,
    moveSelection: vi.fn(),
    query: "",
    results: { channels: [], communities: [], files: [] },
    setActiveFilter: vi.fn(),
    setActiveIndex: vi.fn(),
    setQuery: vi.fn()
}));

vi.mock("../../../hooks/useSearch.js", () => ({
    useSearch: () => search
}));

describe("SearchModal", () => {
    beforeEach(() => {
        search.activateResult.mockReset();
        search.activeIndex = -1;
        search.clearSearch.mockReset();
        search.moveSelection.mockReset();
        search.setQuery.mockReset();
    });

    it("renders the dialog and reusable SearchBar when open", () => {
        render(<SearchModal onClose={() => {}} open />);
        const input = screen.getByRole("combobox", {
            name: "Search StudentHub"
        });

        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(input).toHaveAttribute("placeholder", "Search StudentHub...");
        expect(input).toHaveFocus();
    });

    it("does not render when closed", () => {
        render(<SearchModal onClose={() => {}} open={false} />);

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("closes with the close button", async () => {
        const onClose = vi.fn();
        const user = userEvent.setup();
        render(<SearchModal onClose={onClose} open />);

        await user.click(screen.getByRole("button", { name: "Close Search" }));

        expect(onClose).toHaveBeenCalledOnce();
    });

    it("closes with Escape", () => {
        const onClose = vi.fn();
        render(<SearchModal onClose={onClose} open />);

        fireEvent.keyDown(document, { key: "Escape" });

        expect(onClose).toHaveBeenCalledOnce();
    });

    it("closes when the backdrop is clicked", () => {
        const onClose = vi.fn();
        render(<SearchModal onClose={onClose} open />);

        const overlay = screen.getByRole("dialog").parentElement;
        fireEvent.mouseDown(overlay);

        expect(onClose).toHaveBeenCalledOnce();
    });

    it("keeps keyboard focus inside the dialog", () => {
        render(<SearchModal onClose={() => {}} open />);
        const close = screen.getByRole("button", { name: "Close Search" });
        close.focus();

        fireEvent.keyDown(document, { key: "Tab", shiftKey: true });

        expect(screen.getByRole("button", { name: "Files" })).toHaveFocus();
    });

    it.each([
        ["ArrowDown", 1],
        ["ArrowUp", -1]
    ])("handles %s result navigation", (key, direction) => {
        render(<SearchModal onClose={() => {}} open />);

        fireEvent.keyDown(screen.getByRole("combobox"), { key });

        expect(search.moveSelection).toHaveBeenCalledWith(direction);
    });

    it("opens the active result with Enter", () => {
        search.activeIndex = 0;
        render(<SearchModal onClose={() => {}} open />);

        fireEvent.keyDown(screen.getByRole("combobox"), { key: "Enter" });

        expect(search.activateResult).toHaveBeenCalledOnce();
    });

    it("restores focus to the opener after closing", async () => {
        const user = userEvent.setup();

        function Harness() {
            const [open, setOpen] = useState(false);
            return (
                <>
                    <button onClick={() => setOpen(true)} type="button">
                        Open search
                    </button>
                    <SearchModal onClose={() => setOpen(false)} open={open} />
                </>
            );
        }

        render(<Harness />);
        const opener = screen.getByRole("button", { name: "Open search" });
        await user.click(opener);
        await user.click(screen.getByRole("button", { name: "Close Search" }));

        await waitFor(() => expect(opener).toHaveFocus());
    });
});
