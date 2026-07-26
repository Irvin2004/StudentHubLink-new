import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SearchModal from "./SearchModal.jsx";

const search = vi.hoisted(() => ({
    activateResult: vi.fn(),
    activeFilter: "all",
    activeIndex: -1,
    closeSearch: vi.fn(),
    error: "",
    isOpen: true,
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
        search.closeSearch.mockReset();
        search.moveSelection.mockReset();
        search.setQuery.mockReset();
        search.isOpen = true;
    });

    it("opens with the search field focused", () => {
        render(<SearchModal />);
        const input = screen.getByRole("combobox", {
            name: "Search StudentHub"
        });
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(input).toHaveFocus();
    });

    it("closes with Escape", () => {
        render(<SearchModal />);
        fireEvent.keyDown(document, { key: "Escape" });
        expect(search.closeSearch).toHaveBeenCalled();
    });

    it("keeps keyboard focus inside the dialog", () => {
        render(<SearchModal />);
        const close = screen.getByRole("button", { name: "Close dialog" });
        close.focus();
        fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
        expect(screen.getByRole("button", { name: "Files" })).toHaveFocus();
    });

    it("handles result navigation keys from the input", () => {
        render(<SearchModal />);
        const input = screen.getByRole("combobox", {
            name: "Search StudentHub"
        });
        fireEvent.keyDown(input, { key: "ArrowDown" });
        expect(search.moveSelection).toHaveBeenCalledWith(1);
    });
});
