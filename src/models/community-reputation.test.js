import { describe, expect, test } from "vitest";

import {
    COMMUNITY_BADGES,
    createCommunityReputation,
    getReputationLevel,
    hasTrustCapability,
    TRUST_CAPABILITIES,
    REPUTATION_LEVELS
} from "./community-reputation.js";

describe("community reputation model", () => {
    test.each([
        [0, "Newcomer"],
        [24, "Newcomer"],
        [25, "Contributor"],
        [75, "Helper"],
        [200, "Expert"]
    ])("maps %i points to %s", (points, level) => {
        expect(getReputationLevel(points)).toBe(level);
    });

    test("normalizes a derived reputation summary", () => {
        expect(
            createCommunityReputation({
                displayName: "  Mpho  ",
                eventCount: 8,
                points: 82,
                userId: "student-1"
            })
        ).toMatchObject({
            displayName: "Mpho",
            eventCount: 8,
            level: "Helper",
            points: 82,
            userId: "student-1"
        });
    });

    test("keeps the four requested levels immutable", () => {
        expect(REPUTATION_LEVELS.map((level) => level.label)).toEqual([
            "Expert",
            "Helper",
            "Contributor",
            "Newcomer"
        ]);
        expect(Object.isFrozen(REPUTATION_LEVELS)).toBe(true);
    });

    test("normalizes auditable badge progress and bounded trust capabilities", () => {
        const reputation = createCommunityReputation({
            capabilities: [
                TRUST_CAPABILITIES.CREATE_TOPIC_TAGS,
                "delete_content"
            ],
            contributionStats: { answerUpvotes: 1 },
            points: 60,
            trustLevel: "Trusted Contributor",
            trustRank: 1
        });

        expect(COMMUNITY_BADGES).toHaveLength(5);
        expect(reputation.badges).toContain("first_helpful_answer");
        expect(reputation.badgeProgress[0]).toMatchObject({
            current: 1,
            earned: true,
            target: 1
        });
        expect(
            hasTrustCapability(reputation, TRUST_CAPABILITIES.CREATE_TOPIC_TAGS)
        ).toBe(true);
        expect(reputation.capabilities).not.toContain("delete_content");
    });
});
