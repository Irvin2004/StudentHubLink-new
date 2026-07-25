import {
    COMMUNITY_PERMISSIONS,
    hasCommunityPermission
} from "./community-permissions.js";
import { COMMUNITY_ROLES } from "./community-roles.js";
import { CHANNEL_TYPES } from "./channel-types.js";

export const CHANNEL_PERMISSIONS = Object.freeze({
    CREATE: "create",
    EDIT: "edit",
    DELETE: "delete",
    POST: "post",
    VIEW: "view"
});

export function canCreateChannel(role) {
    return hasCommunityPermission(
        role,
        COMMUNITY_PERMISSIONS.CAN_CREATE_CHANNELS
    );
}

export function canManageChannel(role) {
    return [COMMUNITY_ROLES.OWNER, COMMUNITY_ROLES.ADMIN].includes(role);
}

export function canPostInChannel(role, channel) {
    if (!role) return false;

    return (
        channel?.type !== CHANNEL_TYPES.ANNOUNCEMENTS || canManageChannel(role)
    );
}

export function canViewChannel(role) {
    return Boolean(role);
}
