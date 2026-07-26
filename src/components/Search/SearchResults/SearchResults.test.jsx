import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SearchResults from "./SearchResults.jsx";

const search = vi.hoisted(() => ({
    error: "",
    loading: false,
    openResult: vi.fn(),
    query: "python",
    results: { channels: [], communities: [], files: [] },
    selectedIndex: 0
}));

vi.mock("../../../hooks/useSearch.js", () => ({
    useSearch: () => search
}));

describe("SearchResults", () => {
    it("renders grouped result sections", () => {
        search.results = {
            channels: [
                {
                    icon: "channel",
                    id: "python-help",
                    subtitle: "Questions",
                    title: "#python-help",
                    type: "channel",
                    url: "/channel"
                }
            ],
            communities: [
                {
                    icon: "community",
                    id: "programming",
                    subtitle: "Computer Science",
                    title: "Programming Society",
                    type: "community",
                    url: "/community"
                }
            ],
            files: [
                {
                    icon: "file",
                    id: "notes",
                    subtitle: "Alex",
                    title: "Python Notes.pdf",
                    type: "file",
                    url: "/file"
                }
            ]
        };

        render(<SearchResults />);
        expect(
            screen.getByRole("heading", { name: "Communities" })
        ).toBeInTheDocument();
        expect(
            screen.getByRole("heading", { name: "Channels" })
        ).toBeInTheDocument();
        expect(
            screen.getByRole("heading", { name: "Files" })
        ).toBeInTheDocument();
        expect(screen.getAllByRole("option")).toHaveLength(3);

        fireEvent.click(
            screen.getByRole("option", { name: /Programming Society/ })
        );
        expect(search.openResult).toHaveBeenCalledWith(
            search.results.communities[0]
        );
    });

    it("renders the empty state", () => {
        search.results = { channels: [], communities: [], files: [] };
        search.loading = false;
        search.error = "";
        search.query = "nothing";
        render(<SearchResults />);
        expect(screen.getByText("No results found.")).toBeInTheDocument();
        expect(
            screen.getByText("Try another keyword or check your spelling.")
        ).toBeInTheDocument();
    });

    it("renders skeletons while loading", () => {
        search.loading = true;
        render(<SearchResults />);
        expect(screen.getByRole("status", { name: "" })).toHaveTextContent(
            "Searching StudentHub"
        );
        search.loading = false;
    });

    it("keeps previous results visible while loading the next query", () => {
        search.results = {
            channels: [],
            communities: [
                {
                    icon: "community",
                    id: "programming",
                    subtitle: "Computer Science",
                    title: "Programming Society",
                    type: "community",
                    url: "/community"
                }
            ],
            files: []
        };
        search.loading = true;

        render(<SearchResults />);

        expect(screen.getByText("Programming Society")).toBeVisible();
        expect(screen.getByRole("status")).toHaveTextContent(
            "Searching StudentHub"
        );
        search.loading = false;
    });

    it("renders nothing until the minimum query length is reached", () => {
        search.results = { channels: [], communities: [], files: [] };
        search.query = "a";

        const { container } = render(<SearchResults />);

        expect(container).toBeEmptyDOMElement();
        search.query = "python";
    });

    it("renders an actionable error state", () => {
        search.error = "Check your internet connection and try again.";
        render(<SearchResults />);
        expect(screen.getByRole("alert")).toHaveTextContent(
            "Unable to search StudentHub."
        );
        expect(screen.getByRole("alert")).toHaveTextContent(
            "Please try again."
        );
        search.error = "";
    });
});
