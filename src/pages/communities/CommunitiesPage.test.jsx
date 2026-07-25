import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

const communities = [
    {
        id: "community-1",
        name: "Robotics Club",
        description: "Build robots together.",
        avatar: null,
        banner: null,
        ownerId: "owner-1",
        visibility: "public",
        category: "technology",
        memberCount: 124
    },
    {
        id: "community-2",
        name: "Campus Creatives",
        description: "Make art together.",
        avatar: null,
        banner: null,
        ownerId: "owner-2",
        visibility: "private",
        category: "arts",
        memberCount: 77
    }
];

vi.mock("../../hooks/useAuth.js", () => ({
    useAuth: () => ({ user: { uid: "user-1" } })
}));

vi.mock("../../hooks/useToast.js", () => ({
    useToast: () => ({ showToast: vi.fn() })
}));

vi.mock("../../hooks/useCommunities.js", () => ({
    useCommunities: ({ enabled } = {}) =>
        enabled === false
            ? {
                  joinCommunity: vi.fn(),
                  leaveCommunity: vi.fn()
              }
            : {
                  communities,
                  createCommunity: vi.fn(),
                  error: null,
                  loading: false,
                  refreshCommunities: vi.fn()
              }
}));

import CommunitiesPage from "./CommunitiesPage.jsx";

describe("CommunitiesPage", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    test("filters rendered communities after the debounced search", () => {
        vi.useFakeTimers();
        render(
            <MemoryRouter>
                <CommunitiesPage />
            </MemoryRouter>
        );

        expect(
            screen.getByRole("heading", { name: "Robotics Club" })
        ).toBeInTheDocument();
        expect(
            screen.getByRole("heading", { name: "Campus Creatives" })
        ).toBeInTheDocument();

        fireEvent.change(
            screen.getByRole("searchbox", { name: "Search communities" }),
            { target: { value: "robotics" } }
        );
        act(() => vi.advanceTimersByTime(300));

        expect(
            screen.getByRole("heading", { name: "Robotics Club" })
        ).toBeInTheDocument();
        expect(
            screen.queryByRole("heading", { name: "Campus Creatives" })
        ).not.toBeInTheDocument();
    });
});
