import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import CommunitySearch from "./CommunitySearch.jsx";

describe("CommunitySearch", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    test("debounces search changes and updates category immediately", () => {
        vi.useFakeTimers();
        const onSearch = vi.fn();
        const onCategoryChange = vi.fn();

        render(
            <CommunitySearch
                category=""
                onCategoryChange={onCategoryChange}
                onSearch={onSearch}
            />
        );

        fireEvent.change(
            screen.getByRole("searchbox", { name: "Search communities" }),
            { target: { value: "robotics" } }
        );
        expect(onSearch).not.toHaveBeenCalled();

        act(() => vi.advanceTimersByTime(300));
        expect(onSearch).toHaveBeenCalledWith("robotics");

        fireEvent.change(
            screen.getByRole("combobox", {
                name: "Filter communities by category"
            }),
            { target: { value: "technology" } }
        );
        expect(onCategoryChange).toHaveBeenCalledWith("technology");
    });
});
