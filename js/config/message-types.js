"use strict";

export const MESSAGE_TYPES = Object.freeze({
    TEXT: "text",
    IMAGE: "image",
    FILE: "file",
    VOICE: "voice",
    SYSTEM: "system"
});

export function isValidMessageType(type) {
    return Object.values(MESSAGE_TYPES).includes(type);
}
