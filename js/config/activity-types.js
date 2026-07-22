"use strict";

export const ACTIVITY_TYPES = Object.freeze({
    ASSIGNMENT_CREATED: "assignment_created",
    ASSIGNMENT_UPDATED: "assignment_updated",

    RESOURCE_CREATED: "resource_created",

    MESSAGE_SENT: "message_sent",

    FRIEND_REQUEST_ACCEPTED: "friend_request_accepted",

    GROUP_CREATED: "group_created",
    GROUP_JOINED: "group_joined",

    SYSTEM: "system"
});

export function isValidActivityType(type) {
    return Object.values(ACTIVITY_TYPES).includes(type);
}
