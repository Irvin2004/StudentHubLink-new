export const REACTION_TYPES = Object.freeze({
    THUMBS_UP: "👍",
    HEART: "❤️",
    LAUGH: "😂",
    CELEBRATE: "🎉",
    SAD: "😢",
    CLAP: "👏"
});

export const REACTION_VALUES = Object.freeze(Object.values(REACTION_TYPES));

export const REACTION_KEYS = Object.freeze({
    "👍": "thumbsUp",
    "❤️": "heart",
    "😂": "laugh",
    "🎉": "celebrate",
    "😢": "sad",
    "👏": "clap"
});

export const REACTION_EMOJIS = Object.freeze(
    Object.fromEntries(
        Object.entries(REACTION_KEYS).map(([emoji, key]) => [key, emoji])
    )
);

export function isReactionType(value) {
    return REACTION_VALUES.includes(value);
}
