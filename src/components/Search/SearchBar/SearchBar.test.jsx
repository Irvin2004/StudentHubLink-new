import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SearchBar from "./SearchBar.jsx";

const DEFAULT_PROPS = Object.freeze({
    onChange: () => {},
    value: ""
});

describe("SearchBar", () => {
    it("renders the search input and default placeholder", () => {
        render(<SearchBar {...DEFAULT_PROPS} />);

        expect(screen.getByRole("searchbox")).toHaveAttribute(
            "placeholder",
            "Search StudentHub..."
        );
    });

    it("renders a custom placeholder", () => {
        render(
            <SearchBar {...DEFAULT_PROPS} placeholder="Search this channel" />
        );

        expect(
            screen.getByPlaceholderText("Search this channel")
        ).toBeVisible();
    });

    it("calls onChange with the typed value", () => {
        const onChange = vi.fn();
        render(<SearchBar onChange={onChange} value="" />);

        fireEvent.change(
            screen.getByRole("searchbox", { name: "Search StudentHub" }),
            { target: { value: "robotics" } }
        );

        expect(onChange).toHaveBeenCalledWith("robotics");
    });

    it("shows the clear button when text exists and calls onClear", () => {
        const onClear = vi.fn();
        render(
            <SearchBar onChange={() => {}} onClear={onClear} value="robotics" />
        );

        fireEvent.click(screen.getByRole("button", { name: "Clear search" }));

        expect(onClear).toHaveBeenCalledOnce();
    });

    it("clears through onChange when onClear is omitted", () => {
        const onChange = vi.fn();
        render(<SearchBar onChange={onChange} value="robotics" />);

        fireEvent.keyDown(screen.getByRole("searchbox"), { key: "Escape" });

        expect(onChange).toHaveBeenCalledWith("");
    });

    it("shows an accessible spinner and hides clear while loading", () => {
        render(<SearchBar loading onChange={() => {}} value="robotics" />);

        expect(screen.getByRole("status", { name: "Searching" })).toBeVisible();
        expect(
            screen.queryByRole("button", { name: "Clear search" })
        ).not.toBeInTheDocument();
    });

    it("provides accessible names for the input and clear button", () => {
        render(<SearchBar onChange={() => {}} value="robotics" />);

        expect(
            screen.getByRole("searchbox", { name: "Search StudentHub" })
        ).toBeVisible();
        expect(
            screen.getByRole("button", { name: "Clear search" })
        ).toBeVisible();
    });

    it("supports autofocus and disabled states", () => {
        const { rerender } = render(
            <SearchBar autoFocus onChange={() => {}} value="" />
        );

        expect(screen.getByRole("searchbox")).toHaveFocus();

        rerender(<SearchBar disabled onChange={() => {}} value="" />);
        expect(screen.getByRole("searchbox")).toBeDisabled();
    });
});
