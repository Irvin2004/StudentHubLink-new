import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SearchProvider } from "../context/SearchContext.jsx";
import SearchModal from "../components/Search/SearchModal/SearchModal.jsx";
import { useSearch } from "./useSearch.js";

const service = vi.hoisted(() => ({
    globalSearch: vi.fn()
}));

vi.mock("../services/search-service.js", () => ({
    globalSearch: service.globalSearch
}));

function Harness() {
    const { isOpen, loading, query, results, setQuery } = useSearch();
    return (
        <>
            <output data-testid="open">{String(isOpen)}</output>
            <output data-testid="loading">{String(loading)}</output>
            <output data-testid="query">{query}</output>
            <output data-testid="results">
                {results.communities.map((item) => item.title).join(",")}
            </output>
            <button type="button" onClick={() => setQuery("robotics")}>
                Search
            </button>
            <button type="button" onClick={() => setQuery("a")}>
                Short query
            </button>
        </>
    );
}

function renderSearch() {
    return render(
        <MemoryRouter>
            <SearchProvider>
                <Harness />
            </SearchProvider>
        </MemoryRouter>
    );
}

function SearchIntegration() {
    const location = useLocation();
    const { closeSearch, isOpen } = useSearch();
    return (
        <>
            <button type="button">Previous control</button>
            <output data-testid="location">{location.pathname}</output>
            <SearchModal onClose={closeSearch} open={isOpen} />
        </>
    );
}

function renderSearchIntegration() {
    return render(
        <MemoryRouter initialEntries={["/app"]}>
            <SearchProvider>
                <SearchIntegration />
            </SearchProvider>
        </MemoryRouter>
    );
}

describe("useSearch", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        service.globalSearch.mockReset();
        service.globalSearch.mockResolvedValue({
            channels: [],
            communities: [
                {
                    id: "robotics",
                    title: "Robotics Club",
                    type: "community",
                    url: "/community/robotics"
                }
            ],
            files: []
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("opens from Ctrl + K anywhere in the application", () => {
        renderSearch();
        fireEvent.keyDown(document, { ctrlKey: true, key: "k" });
        expect(screen.getByTestId("open")).toHaveTextContent("true");
    });

    it("debounces searches for 300 milliseconds", async () => {
        renderSearch();
        fireEvent.click(screen.getByRole("button", { name: "Search" }));
        expect(screen.getByTestId("loading")).toHaveTextContent("true");
        expect(service.globalSearch).not.toHaveBeenCalled();

        await act(() => vi.advanceTimersByTimeAsync(299));
        expect(service.globalSearch).not.toHaveBeenCalled();

        await act(() => vi.advanceTimersByTimeAsync(1));
        expect(service.globalSearch).toHaveBeenCalledWith("robotics");
        expect(screen.getByTestId("results")).toHaveTextContent(
            "Robotics Club"
        );
    });

    it("does not search for fewer than two characters", async () => {
        renderSearch();
        fireEvent.click(screen.getByRole("button", { name: "Short query" }));
        await act(() => vi.advanceTimersByTimeAsync(400));
        expect(service.globalSearch).not.toHaveBeenCalled();
    });

    it("restores focus after Escape closes the command palette", async () => {
        renderSearchIntegration();
        const previousControl = screen.getByRole("button", {
            name: "Previous control"
        });
        previousControl.focus();

        fireEvent.keyDown(previousControl, { ctrlKey: true, key: "k" });
        expect(
            screen.getByRole("combobox", { name: "Search StudentHub" })
        ).toHaveFocus();

        fireEvent.keyDown(document, { key: "Escape" });
        await act(async () => {});
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(previousControl).toHaveFocus();
    });

    it("opens the selected result with arrows and Enter", async () => {
        renderSearchIntegration();
        fireEvent.keyDown(document, { ctrlKey: true, key: "k" });
        const input = screen.getByRole("combobox", {
            name: "Search StudentHub"
        });
        fireEvent.change(input, { target: { value: "robotics" } });
        await act(() => vi.advanceTimersByTimeAsync(300));

        fireEvent.keyDown(input, { key: "ArrowDown" });
        fireEvent.keyDown(input, { key: "Enter" });

        expect(screen.getByTestId("location")).toHaveTextContent(
            "/community/robotics"
        );
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
});
