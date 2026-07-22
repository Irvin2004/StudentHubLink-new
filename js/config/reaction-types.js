"use strict";

export const REACTION_TYPES = Object.freeze({
    LIKE: "👍",
    LOVE: "❤️",
    LAUGH: "😂",
    WOW: "😮",
    CELEBRATE: "🎉"
});

export function isValidReaction(reaction) {
    return Object.values(REACTION_TYPES).includes(reaction);
}
