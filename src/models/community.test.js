import { describe, expect, test } from "vitest";

import {
    COMMUNITY_VISIBILITY,
    Community,
    createCommunityModel
} from "./community.js";

const validCommunity = {
    id: "community-1",
    name: "  Robotics   Club ",
    description: "Build robots together.",
    avatar: "https://example.com/avatar.png",
    banner: null,
    ownerId: "user-1",
    visibility: COMMUNITY_VISIBILITY.PUBLIC,
    category: "technology",
    memberCount: 1,
    createdAt: 100,
    updatedAt: 200
};

describe("Community model", () => {
    test("normalizes and freezes community data", () => {
        const community = createCommunityModel(validCommunity);

        expect(community).toEqual({
            ...validCommunity,
            name: "Robotics Club",
            normalizedName: "robotics club"
        });
        expect(Object.isFrozen(community)).toBe(true);
    });

    test("supports the convenience class with the same contract", () => {
        const community = new Community(validCommunity);

        expect(community.id).toBe("community-1");
        expect(community.normalizedName).toBe("robotics club");
        expect(Object.isFrozen(community)).toBe(true);
    });

    test("rejects invalid visibility and member counts", () => {
        expect(() =>
            createCommunityModel({
                ...validCommunity,
                visibility: "secret"
            })
        ).toThrow(/visibility/);
        expect(() =>
            createCommunityModel({
                ...validCommunity,
                memberCount: -1
            })
        ).toThrow(/member count/);
    });
});
