import { COMMUNITY_ROLES, isCommunityRole } from "../config/community-roles.js";

/**
 * Creates an immutable, normalized community member model.
 *
 * @param {object} data
 * @returns {Readonly<object>}
 */
export function createCommunityMemberModel(data = {}) {
    if (!data.userId) {
        throw new TypeError("A community member user ID is required.");
    }

    if (!data.communityId) {
        throw new TypeError("A community ID is required.");
    }

    const role = data.role ?? COMMUNITY_ROLES.MEMBER;

    if (!isCommunityRole(role)) {
        throw new TypeError(`Unsupported community role: ${role}.`);
    }

    const nickname =
        data.nickname === undefined || data.nickname === null
            ? null
            : String(data.nickname).trim() || null;

    if (nickname && nickname.length > 80) {
        throw new TypeError(
            "Community nickname must not exceed 80 characters."
        );
    }

    return Object.freeze({
        userId: String(data.userId),
        communityId: String(data.communityId),
        role,
        joinedAt: data.joinedAt ?? null,
        nickname
    });
}

/**
 * Community member model convenience class.
 */
export class CommunityMember {
    constructor(data) {
        Object.assign(this, createCommunityMemberModel(data));
        Object.freeze(this);
    }
}
