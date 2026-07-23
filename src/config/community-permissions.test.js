import { describe, expect, test } from "vitest";

import {
    COMMUNITY_PERMISSIONS,
    getCommunityPermissions,
    hasCommunityPermission
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
});
