import { describe, expect, test } from "vitest";

import {
    canDeleteCommunity,
    canDeleteCommunityFile,
    canDeleteCommunityMessage,
    canEditCommunity,
    canManageMembers,
    canModerateContent,
    canPinCommunityMessage,
    COMMUNITY_PERMISSIONS,
    getCommunityPermissions,
    hasCommunityPermission,
    isCommunityOwner
} from "./community-permissions.js";
import { COMMUNITY_ROLES, isCommunityRole } from "./community-roles.js";

describe("community permissions", () => {
    test("grants owners every community permission", () => {
        for (const permission of Object.values(COMMUNITY_PERMISSIONS)) {
            expect(
                hasCommunityPermission(COMMUNITY_ROLES.OWNER, permission)
            ).toBe(true);
        }
    });

    test("limits moderator and member capabilities", () => {
        expect(
            hasCommunityPermission(
                COMMUNITY_ROLES.MODERATOR,
                COMMUNITY_PERMISSIONS.CAN_DELETE_MESSAGES
            )
        ).toBe(true);
        expect(
            hasCommunityPermission(
                COMMUNITY_ROLES.MODERATOR,
                COMMUNITY_PERMISSIONS.CAN_MANAGE_MEMBERS
            )
        ).toBe(false);
        expect(getCommunityPermissions(COMMUNITY_ROLES.MEMBER)).toEqual([]);
    });

    test("recognizes only configured roles", () => {
        expect(isCommunityRole(COMMUNITY_ROLES.ADMIN)).toBe(true);
        expect(isCommunityRole("administrator")).toBe(false);
    });

    test("exposes named guards for community actions", () => {
        expect(canEditCommunity(COMMUNITY_ROLES.ADMIN)).toBe(true);
        expect(canDeleteCommunity(COMMUNITY_ROLES.ADMIN)).toBe(false);
        expect(canManageMembers(COMMUNITY_ROLES.ADMIN)).toBe(true);
        expect(canModerateContent(COMMUNITY_ROLES.MODERATOR)).toBe(true);
        expect(canPinCommunityMessage(COMMUNITY_ROLES.MODERATOR)).toBe(true);
        expect(canPinCommunityMessage(COMMUNITY_ROLES.MEMBER)).toBe(false);
        expect(
            isCommunityOwner({ uid: "owner-1" }, { ownerId: "owner-1" })
        ).toBe(true);
    });

    test("allows authors and authorized roles to delete owned content", () => {
        expect(
            canDeleteCommunityMessage(
                { senderId: "user-1" },
                "user-1",
                COMMUNITY_ROLES.MEMBER
            )
        ).toBe(true);
        expect(
            canDeleteCommunityMessage(
                { senderId: "user-1" },
                "user-2",
                COMMUNITY_ROLES.MODERATOR
            )
        ).toBe(true);
        expect(
            canDeleteCommunityFile(
                { uploadedBy: "user-1" },
                "user-2",
                COMMUNITY_ROLES.ADMIN
            )
        ).toBe(true);
        expect(
            canDeleteCommunityFile(
                { uploadedBy: "user-1" },
                "user-2",
                COMMUNITY_ROLES.MODERATOR
            )
        ).toBe(false);
    });
});
