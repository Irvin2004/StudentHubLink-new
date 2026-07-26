import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import SearchModal from "../components/Search/SearchModal/SearchModal.jsx";
import { SearchProvider } from "../context/SearchContext.jsx";
import { useSearch } from "./useSearch.js";

const service = vi.hoisted(() => ({
    globalSearch: vi.fn()
}));

vi.mock("../services/search-service.js", () => ({
    globalSearch: service.globalSearch
}));

function resultSet(term) {
    return {
        channels: [
            {
                id: `${term}-channel`,
                title: `${term} channel`,
                type: "channel",
                url: `/community/test/channel/${term}`
            }
        ],
        communities: [
            {
                id: `${term}-community`,
                title: `${term} community`,
                type: "community",
                url: `/community/${term}`
            }
        ],
        files: []
    };
}

function Harness() {
    const search = useSearch();

    return (
        <>
            <output data-testid="open">{String(search.isOpen)}</output>
            <output data-testid="loading">{String(search.loading)}</output>
            <output data-testid="query">{search.query}</output>
            <output data-testid="error">{search.error}</output>
            <output data-testid="filter">{search.filter}</output>
            <output data-testid="selected">{search.selectedIndex}</output>
            <output data-testid="results">
                {search.results.communities.map((item) => item.title).join(",")}
            </output>
            <button onClick={search.openSearch} type="button">
                Open
            </button>
            <button onClick={search.closeSearch} type="button">
                Close
            </button>
            <button onClick={search.clearSearch} type="button">
                Clear
            </button>
            <button
                onClick={() => search.performSearch("provider-query")}
                type="button"
            >
                Search provider
            </button>
            <button
                onClick={() => search.performSearch("cache-query")}
                type="button"
            >
                Search cache
            </button>
            <button
                onClick={() => search.performSearch("error-query")}
                type="button"
            >
                Search error
            </button>
            <button
                onClick={() => search.performSearch("navigation-query")}
                type="button"
            >
                Search navigation
            </button>
            <button onClick={search.selectNext} type="button">
                Next
            </button>
            <button onClick={search.selectPrevious} type="button">
                Previous
            </button>
            <button onClick={() => search.openResult()} type="button">
                Open selected
            </button>
            <button onClick={() => search.setFilter("community")} type="button">
                Communities only
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

describe("SearchProvider and useSearch", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        service.globalSearch.mockReset();
        service.globalSearch.mockImplementation(async (term) =>
            resultSet(term)
        );
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("renders children inside the provider", () => {
        renderSearch();

        expect(screen.getByRole("button", { name: "Open" })).toBeVisible();
    });

    it("throws when useSearch is used outside SearchProvider", () => {
        function OutsideConsumer() {
            useSearch();
            return null;
        }

        expect(() =>
            render(
                <MemoryRouter>
                    <OutsideConsumer />
                </MemoryRouter>
            )
        ).toThrow("useSearch must be used inside SearchProvider");
    });

    it("opens, closes, and clears search state through public actions", () => {
        renderSearch();
        fireEvent.click(screen.getByRole("button", { name: "Open" }));
        expect(screen.getByTestId("open")).toHaveTextContent("true");

        fireEvent.click(
            screen.getByRole("button", { name: "Search provider" })
        );
        expect(screen.getByTestId("query")).toHaveTextContent("provider-query");
        fireEvent.click(screen.getByRole("button", { name: "Clear" }));
        expect(screen.getByTestId("query")).toBeEmptyDOMElement();

        fireEvent.click(screen.getByRole("button", { name: "Close" }));
        expect(screen.getByTestId("open")).toHaveTextContent("false");
    });

    it("opens from Ctrl+K anywhere in the application", () => {
        renderSearch();

        fireEvent.keyDown(document, { ctrlKey: true, key: "k" });

        expect(screen.getByTestId("open")).toHaveTextContent("true");
    });

    it("opens from Command+K on macOS", () => {
        renderSearch();

        fireEvent.keyDown(document, { key: "k", metaKey: true });

        expect(screen.getByTestId("open")).toHaveTextContent("true");
    });

    it.each(["input", "textarea"])(
        "ignores the global shortcut while typing in a %s",
        (element) => {
            renderSearch();
            const editable = document.createElement(element);
            document.body.append(editable);

            fireEvent.keyDown(editable, { ctrlKey: true, key: "k" });

            expect(screen.getByTestId("open")).toHaveTextContent("false");
            editable.remove();
        }
    );

    it("ignores the global shortcut in editable content", () => {
        renderSearch();
        const editable = document.createElement("div");
        editable.setAttribute("contenteditable", "true");
        document.body.append(editable);

        fireEvent.keyDown(editable, { ctrlKey: true, key: "k" });

        expect(screen.getByTestId("open")).toHaveTextContent("false");
        editable.remove();
    });

    it("debounces searches for 300 milliseconds and owns loading state", async () => {
        renderSearch();
        fireEvent.click(
            screen.getByRole("button", { name: "Search provider" })
        );
        expect(screen.getByTestId("loading")).toHaveTextContent("true");
        expect(service.globalSearch).not.toHaveBeenCalled();

        await act(() => vi.advanceTimersByTimeAsync(299));
        expect(service.globalSearch).not.toHaveBeenCalled();

        await act(() => vi.advanceTimersByTimeAsync(1));
        expect(service.globalSearch).toHaveBeenCalledWith("provider-query");
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    it("returns cached results without another service call", async () => {
        renderSearch();
        const searchCache = screen.getByRole("button", {
            name: "Search cache"
        });

        fireEvent.click(searchCache);
        await act(() => vi.advanceTimersByTimeAsync(300));
        expect(service.globalSearch).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole("button", { name: "Clear" }));
        fireEvent.click(searchCache);

        expect(service.globalSearch).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId("results")).toHaveTextContent(
            "cache-query community"
        );
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    it("exposes a safe error and clears loading when the service fails", async () => {
        service.globalSearch.mockRejectedValueOnce(
            new Error("Firebase permission-denied")
        );
        renderSearch();

        fireEvent.click(screen.getByRole("button", { name: "Search error" }));
        await act(() => vi.advanceTimersByTimeAsync(300));

        expect(screen.getByTestId("error")).toHaveTextContent(
            "Unable to search StudentHub."
        );
        expect(screen.getByTestId("error")).not.toHaveTextContent("Firebase");
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    it("owns filter and wrapped keyboard selection state", async () => {
        renderSearch();
        fireEvent.click(
            screen.getByRole("button", { name: "Search navigation" })
        );
        await act(() => vi.advanceTimersByTimeAsync(300));

        expect(screen.getByTestId("selected")).toHaveTextContent("0");
        fireEvent.click(screen.getByRole("button", { name: "Next" }));
        expect(screen.getByTestId("selected")).toHaveTextContent("1");
        fireEvent.click(screen.getByRole("button", { name: "Next" }));
        expect(screen.getByTestId("selected")).toHaveTextContent("0");
        fireEvent.click(screen.getByRole("button", { name: "Previous" }));
        expect(screen.getByTestId("selected")).toHaveTextContent("1");

        fireEvent.click(
            screen.getByRole("button", { name: "Communities only" })
        );
        expect(screen.getByTestId("filter")).toHaveTextContent("community");
        expect(screen.getByTestId("selected")).toHaveTextContent("0");
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
        fireEvent.change(input, {
            target: { value: "integration-query" }
        });
        await act(() => vi.advanceTimersByTimeAsync(300));

        fireEvent.keyDown(input, { key: "ArrowDown" });
        fireEvent.keyDown(input, { key: "Enter" });

        expect(screen.getByTestId("location")).toHaveTextContent(
            "/community/test/channel/integration-query"
        );
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
});
