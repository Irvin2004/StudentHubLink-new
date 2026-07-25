import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test, vi } from "vitest";

import { COMMUNITY_ROLES } from "../../../config/community-roles.js";
import { CHANNEL_TYPES } from "../../../config/channel-types.js";
import ChannelList from "./ChannelList.jsx";

const channels = [
    {
        id: "general",
        name: "general",
        type: CHANNEL_TYPES.TEXT
    },
    {
        id: "robotics",
        name: "robotics",
        type: CHANNEL_TYPES.TEXT
    }
];

describe("ChannelList", () => {
    test("renders the current route and supports arrow-key navigation", () => {
        render(
            <MemoryRouter
                initialEntries={["/community/community-1/channel/general"]}
            >
                <ChannelList
                    channels={channels}
                    communityId="community-1"
                    loading={false}
                    onCreate={vi.fn()}
                    onManage={vi.fn()}
                    role={COMMUNITY_ROLES.OWNER}
                />
            </MemoryRouter>
        );

        const general = screen.getByRole("link", {
            name: "Text channel general"
        });
        const robotics = screen.getByRole("link", {
            name: "Text channel robotics"
        });

        expect(general).toHaveAttribute("aria-current", "page");
        general.focus();
        fireEvent.keyDown(general, { key: "ArrowDown" });
        expect(robotics).toHaveFocus();
        expect(
            screen.getByRole("button", { name: "Create channel" })
        ).toBeInTheDocument();
    });
});
