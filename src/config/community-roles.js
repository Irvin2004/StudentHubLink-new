/**
 * Roles available to members of a community.
 */
export const COMMUNITY_ROLES = Object.freeze({
    OWNER: "owner",
    ADMIN: "admin",
    MODERATOR: "moderator",
    MEMBER: "member"
});

export const COMMUNITY_ROLE_VALUES = Object.freeze(
    Object.values(COMMUNITY_ROLES)
);

/**
 * Checks whether a value is a supported community role.
 *
 * @param {unknown} role
 * @returns {boolean}
 */
export function isCommunityRole(role) {
    return COMMUNITY_ROLE_VALUES.includes(role);
}
