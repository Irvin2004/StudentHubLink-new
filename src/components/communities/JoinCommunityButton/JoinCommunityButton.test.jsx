import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import JoinCommunityButton from "./JoinCommunityButton.jsx";

describe("JoinCommunityButton", () => {
    test("invokes the provided optimistic membership action", async () => {
        const membership = {
            communityId: "community-1",
            userId: "user-1"
        };
        const onJoin = vi.fn().mockResolvedValue(membership);
        const onJoined = vi.fn();
        const user = userEvent.setup();

        render(
            <JoinCommunityButton
                communityName="Robotics Club"
                onJoin={onJoin}
                onJoined={onJoined}
            />
        );

        await user.click(
            screen.getByRole("button", { name: "Join Robotics Club" })
        );

        expect(onJoin).toHaveBeenCalledOnce();
        expect(onJoined).toHaveBeenCalledWith(membership);
    });
});
