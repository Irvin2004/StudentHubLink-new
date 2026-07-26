"use strict";

export const MESSAGE_STATUS = Object.freeze({
    SENT: "sent",
    DELIVERED: "delivered",
    READ: "read"
});

export function isValidMessageStatus(status) {
    return Object.values(MESSAGE_STATUS).includes(status);
}
