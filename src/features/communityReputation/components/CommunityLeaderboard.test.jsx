import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import CommunityLeaderboard from "./CommunityLeaderboard.jsx";

vi.mock("../../../services/community-reputation-service.js", () => ({
    subscribeCommunityLeaderboard: (_communityId, onData) => {
        onData([
            {
                displayName: "Lebo",
                level: "Expert",
                points: 240,
                trustLevel: "Community Curator",
                userId: "lebo"
            },
            {
                displayName: "Mia",
                level: "Helper",
                points: 81,
                trustLevel: "Trusted Contributor",
                userId: "mia"
            }
        ]);
        return vi.fn();
    },
    subscribeCommunityReputation: (_communityId, _userId, onData) => {
        onData({
            level: "Contributor",
            points: 34,
            trustLevel: "Community Member",
            userId: "current-user"
        });
        return vi.fn();
    }
}));

test("shows the community leaders and the current student's reputation", () => {
    render(
        <CommunityLeaderboard
            communityId="community-1"
            currentUserId="current-user"
        />
    );

    expect(screen.getByText("Top contributors")).toBeInTheDocument();
    expect(screen.getByText("Lebo")).toBeInTheDocument();
    expect(screen.getByText("240 pts")).toBeInTheDocument();
    expect(
        screen.getByText("You: 34 pts · Contributor · Community Member")
    ).toBeInTheDocument();
    expect(screen.getByText("You")).toBeInTheDocument();
});
