import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import CommunityTrustPanel from "./CommunityTrustPanel.jsx";

vi.mock("../../../services/community-reputation-service.js", () => ({
    subscribeCommunityReputation: (_communityId, _userId, onData) => {
        onData({
            badgeProgress: [
                {
                    current: 1,
                    description: "Receive an upvote on an answer.",
                    earned: true,
                    id: "first_helpful_answer",
                    label: "First Helpful Answer",
                    target: 1
                },
                {
                    current: 7,
                    description: "Have ten accepted answers.",
                    earned: false,
                    id: "accepted_answers_10",
                    label: "10 Accepted Answers",
                    target: 10
                }
            ],
            capabilities: [
                "create_topic_tags",
                "flag_duplicate_questions",
                "access_curation_tools"
            ],
            level: "Expert",
            trustLevel: "Community Curator"
        });
        return vi.fn();
    }
}));

vi.mock("../../../services/community-trust-service.js", () => ({
    createCommunityTopicTag: vi.fn(),
    subscribeCommunityCurationFlags: (_communityId, onData) => {
        onData([
            {
                createdByName: "Mia",
                id: "flag-1",
                questionTitle: "Repeated limits question"
            }
        ]);
        return vi.fn();
    },
    subscribeCommunityTopicTags: (_communityId, onData) => {
        onData([{ id: "calculus", label: "calculus" }]);
        return vi.fn();
    }
}));

test("shows earned badges, visible progress, and bounded trust tools", () => {
    render(
        <CommunityTrustPanel
            actor={{ displayName: "Lebo", id: "user-1" }}
            communityId="community-1"
            role="member"
        />
    );

    expect(screen.getByText("Community Curator")).toBeInTheDocument();
    expect(screen.getByText(/First Helpful Answer/)).toBeInTheDocument();
    expect(screen.getByText("7/10")).toBeInTheDocument();
    expect(
        screen.getByRole("progressbar", {
            name: "10 Accepted Answers progress"
        })
    ).toHaveAttribute("value", "7");
    expect(
        screen.getByLabelText(/^Create a community topic tag/)
    ).toBeInTheDocument();
    expect(screen.getByText("Community curation queue")).toBeInTheDocument();
    expect(screen.getByText("Repeated limits question")).toBeInTheDocument();
    expect(screen.getByText(/retain final authority/)).toBeInTheDocument();
});
