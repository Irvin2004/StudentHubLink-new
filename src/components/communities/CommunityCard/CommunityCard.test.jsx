import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import CommunityCard from "./CommunityCard.jsx";

const community = {
    id: "community-1",
    name: "Robotics Club",
    description: "Build robots together.",
    avatar: null,
    banner: null,
    visibility: "public",
    category: "technology",
    memberCount: 124
};

describe("CommunityCard", () => {
    test("renders accessible community details and opens from the keyboard", () => {
        const onOpenCommunity = vi.fn();

        render(
            <CommunityCard
                action={<button type="button">Join</button>}
                community={community}
                onOpenCommunity={onOpenCommunity}
            />
        );

        expect(
            screen.getByRole("article", {
                name: "Robotics Club, 124 members"
            })
        ).toBeInTheDocument();
        expect(screen.getByText("Build robots together.")).toBeInTheDocument();
        expect(screen.getByText("public")).toBeInTheDocument();

        fireEvent.keyDown(
            screen.getByRole("article", {
                name: "Robotics Club, 124 members"
            }),
            { key: "Enter" }
        );

        expect(onOpenCommunity).toHaveBeenCalledWith(community);
    });
});
