import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    joinCommunity: vi.fn()
}));

vi.mock("../../../hooks/useCommunities.js", () => ({
    useCommunities: () => ({
        joinCommunity: mocks.joinCommunity
    })
}));

import JoinCommunityButton from "./JoinCommunityButton.jsx";

describe("JoinCommunityButton", () => {
    test("invokes the community hook with the selected community", async () => {
        const membership = {
            communityId: "community-1",
            userId: "user-1"
        };
        const onJoined = vi.fn();
        const user = userEvent.setup();

        mocks.joinCommunity.mockResolvedValue(membership);

        render(
            <JoinCommunityButton
                communityId="community-1"
                communityName="Robotics Club"
                onJoined={onJoined}
            />
        );

        await user.click(
            screen.getByRole("button", { name: "Join Robotics Club" })
        );

        expect(mocks.joinCommunity).toHaveBeenCalledWith("community-1");
        expect(onJoined).toHaveBeenCalledWith(membership);
    });
});
