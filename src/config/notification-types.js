export const NOTIFICATION_TYPES = Object.freeze({
    FRIEND_REQUEST: "friend_request",
    FRIEND_ACCEPTED: "friend_accepted",
    GROUP_INVITE: "group_invite",
    NEW_MESSAGE: "new_message",
    MENTION: "mention",
    CHANNEL_MENTION: "channel_mention",
    NEW_FILE: "new_file",
    NEW_ASSIGNMENT: "new_assignment",
    ASSIGNMENT_DUE: "assignment_due",
    NEW_RESOURCE: "new_resource",
    COMMUNITY_ACTIVITY: "community_activity",
    SYSTEM: "system"
});

export const NOTIFICATION_FILTERS = Object.freeze([
    "all",
    "unread",
    "mentions"
]);
