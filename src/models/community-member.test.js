import { describe, expect, test } from "vitest";

import { COMMUNITY_ROLES } from "../config/community-roles.js";
import {
    CommunityMember,
    createCommunityMemberModel
} from "./community-member.js";

describe("CommunityMember model", () => {
    test("creates an immutable membership with a default member role", () => {
        const member = createCommunityMemberModel({
            userId: "user-1",
            communityId: "community-1",
            nickname: "  Builder  "
        });

        expect(member).toEqual({
            userId: "user-1",
            communityId: "community-1",
            role: COMMUNITY_ROLES.MEMBER,
            joinedAt: null,
            nickname: "Builder"
        });
        expect(Object.isFrozen(member)).toBe(true);
    });

    test("validates roles and supports the convenience class", () => {
        const owner = new CommunityMember({
            userId: "user-1",
            communityId: "community-1",
            role: COMMUNITY_ROLES.OWNER
        });

        expect(owner.role).toBe(COMMUNITY_ROLES.OWNER);
        expect(() =>
            createCommunityMemberModel({
                userId: "user-1",
                communityId: "community-1",
                role: "super-admin"
            })
        ).toThrow(/role/);
    });
});
