import { COMMUNITY_ROLES } from "./community-roles.js";

/**
 * Capabilities that can be granted to community roles.
 */
export const COMMUNITY_PERMISSIONS = Object.freeze({
    CAN_DELETE_MESSAGES: "can_delete_messages",
    CAN_DELETE_FILES: "can_delete_files",
    CAN_CREATE_CHANNELS: "can_create_channels",
    CAN_MANAGE_CHANNELS: "can_manage_channels",
    CAN_MANAGE_MEMBERS: "can_manage_members",
    CAN_EDIT_COMMUNITY: "can_edit_community",
    CAN_DELETE_COMMUNITY: "can_delete_community",
    CAN_MODERATE_CONTENT: "can_moderate_content"
});

const ALL_PERMISSIONS = Object.freeze(Object.values(COMMUNITY_PERMISSIONS));

export const COMMUNITY_ROLE_PERMISSIONS = Object.freeze({
    [COMMUNITY_ROLES.OWNER]: ALL_PERMISSIONS,
    [COMMUNITY_ROLES.ADMIN]: Object.freeze([
        COMMUNITY_PERMISSIONS.CAN_DELETE_MESSAGES,
        COMMUNITY_PERMISSIONS.CAN_DELETE_FILES,
        COMMUNITY_PERMISSIONS.CAN_CREATE_CHANNELS,
        COMMUNITY_PERMISSIONS.CAN_MANAGE_CHANNELS,
        COMMUNITY_PERMISSIONS.CAN_MANAGE_MEMBERS,
        COMMUNITY_PERMISSIONS.CAN_EDIT_COMMUNITY,
        COMMUNITY_PERMISSIONS.CAN_MODERATE_CONTENT
    ]),
    [COMMUNITY_ROLES.MODERATOR]: Object.freeze([
        COMMUNITY_PERMISSIONS.CAN_DELETE_MESSAGES,
        COMMUNITY_PERMISSIONS.CAN_MODERATE_CONTENT
    ]),
    [COMMUNITY_ROLES.MEMBER]: Object.freeze([])
});

/**
 * Returns whether a role includes a permission.
 *
 * @param {string} role
 * @param {string} permission
 * @returns {boolean}
 */
export function hasCommunityPermission(role, permission) {
    return Boolean(COMMUNITY_ROLE_PERMISSIONS[role]?.includes(permission));
}

/**
 * Returns an immutable list of permissions for a role.
 *
 * @param {string} role
 * @returns {readonly string[]}
 */
export function getCommunityPermissions(role) {
    return COMMUNITY_ROLE_PERMISSIONS[role] || Object.freeze([]);
}

export function isCommunityOwner(user, community) {
    const userId = typeof user === "string" ? user : user?.uid;
    return Boolean(userId && community?.ownerId === userId);
}

export function canEditCommunity(role) {
    return hasCommunityPermission(
        role,
        COMMUNITY_PERMISSIONS.CAN_EDIT_COMMUNITY
    );
}

export function canDeleteCommunity(role) {
    return hasCommunityPermission(
        role,
        COMMUNITY_PERMISSIONS.CAN_DELETE_COMMUNITY
    );
}

export function canManageMembers(role) {
    return hasCommunityPermission(
        role,
        COMMUNITY_PERMISSIONS.CAN_MANAGE_MEMBERS
    );
}

export function canModerateContent(role) {
    return hasCommunityPermission(
        role,
        COMMUNITY_PERMISSIONS.CAN_MODERATE_CONTENT
    );
}

export function canPinCommunityMessage(role) {
    return canModerateContent(role);
}

export function canDeleteCommunityMessage(message, userId, role) {
    return Boolean(
        userId &&
        (message?.senderId === userId ||
            hasCommunityPermission(
                role,
                COMMUNITY_PERMISSIONS.CAN_DELETE_MESSAGES
            ))
    );
}

export function canDeleteCommunityFile(file, userId, role) {
    return Boolean(
        userId &&
        (file?.uploadedBy === userId ||
            hasCommunityPermission(
                role,
                COMMUNITY_PERMISSIONS.CAN_DELETE_FILES
            ))
    );
}
