"use strict";

export const PRESENCE_STATUS = Object.freeze({
    ONLINE: "online",
    OFFLINE: "offline",
    TYPING: "typing"
});

export function isValidPresenceStatus(status) {
    return Object.values(PRESENCE_STATUS).includes(status);
}

export function getPresenceLabel(status, isCurrentConversation = false) {
    if (status === PRESENCE_STATUS.TYPING && isCurrentConversation) {
        return "Typing...";
    }

    if (
        status === PRESENCE_STATUS.ONLINE ||
        status === PRESENCE_STATUS.TYPING
    ) {
        return "Online";
    }

    return "Offline";
}
