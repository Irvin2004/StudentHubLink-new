import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, test } from "vitest";

import ActivityFeed from "./ActivityFeed.jsx";

test("renders typed activity and links channel events", () => {
    render(
        <MemoryRouter>
            <ActivityFeed
                activities={[
                    {
                        id: "activity-1",
                        type: "channel_created",
                        title: "Alex created #robotics",
                        description: "A new project channel.",
                        communityId: "community-1",
                        channelId: "robotics",
                        createdAt: new Date("2026-07-26T08:00:00Z")
                    }
                ]}
                loading={false}
            />
        </MemoryRouter>
    );

    expect(
        screen.getByRole("heading", { name: "Community activity" })
    ).toBeVisible();
    expect(screen.getByText("Alex created #robotics")).toBeVisible();
    expect(screen.getByRole("link", { name: "Open channel" })).toHaveAttribute(
        "href",
        "/community/community-1/channel/robotics"
    );
});
