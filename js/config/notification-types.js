/**
 * StudentHub Notification Types
 *
 * These constants are the only valid notification types used throughout the
 * application. Use the constants instead of string literals so notification
 * producers and consumers share the same values.
 *
 * FRIEND_REQUEST
 * User received a friend request.
 *
 * FRIEND_ACCEPTED
 * Friend request accepted.
 *
 * GROUP_INVITE
 * Invitation to join a study group.
 *
 * NEW_MESSAGE
 * New chat message.
 *
 * NEW_ASSIGNMENT
 * New assignment created in a group.
 *
 * ASSIGNMENT_DUE
 * Reminder that an assignment is approaching its due date.
 *
 * NEW_RESOURCE
 * Study resource uploaded.
 *
 * MENTION
 * User mentioned in a message.
 *
 * SYSTEM
 * General application notification.
 */
export const NOTIFICATION_TYPES = Object.freeze({
    FRIEND_REQUEST: "friend_request",
    FRIEND_ACCEPTED: "friend_accepted",
    GROUP_INVITE: "group_invite",

    NEW_MESSAGE: "new_message",

    NEW_ASSIGNMENT: "new_assignment",
    ASSIGNMENT_DUE: "assignment_due",

    NEW_RESOURCE: "new_resource",

    MENTION: "mention",

    SYSTEM: "system"
});
