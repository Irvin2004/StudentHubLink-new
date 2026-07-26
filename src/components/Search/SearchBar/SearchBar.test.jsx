import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SearchBar from "./SearchBar.jsx";

const search = vi.hoisted(() => ({
    openSearch: vi.fn(),
    query: "",
    setQuery: vi.fn()
}));

vi.mock("../../../hooks/useSearch.js", () => ({
    useSearch: () => search
}));

describe("SearchBar", () => {
    beforeEach(() => {
        search.openSearch.mockReset();
        search.setQuery.mockReset();
        search.query = "";
    });

    it("renders the search control and shortcut hint", () => {
        render(<SearchBar />);
        expect(
            screen.getByRole("searchbox", { name: "Search StudentHub" })
        ).toBeInTheDocument();
        expect(screen.getByText("Ctrl K")).toBeInTheDocument();
    });

    it("updates the query and opens search while typing", () => {
        render(<SearchBar />);
        fireEvent.change(
            screen.getByRole("searchbox", { name: "Search StudentHub" }),
            { target: { value: "robotics" } }
        );
        expect(search.setQuery).toHaveBeenCalledWith("robotics");
        expect(search.openSearch).toHaveBeenCalled();
    });

    it("opens search from the mobile search button", () => {
        render(<SearchBar />);
        fireEvent.click(
            screen.getByRole("button", { name: "Open global search" })
        );
        expect(search.openSearch).toHaveBeenCalled();
    });
});
