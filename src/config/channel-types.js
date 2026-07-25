export const CHANNEL_TYPES = Object.freeze({
    TEXT: "TEXT",
    ANNOUNCEMENTS: "ANNOUNCEMENTS"
});

export const CHANNEL_TYPE_VALUES = Object.freeze(Object.values(CHANNEL_TYPES));

export function isChannelType(value) {
    return CHANNEL_TYPE_VALUES.includes(value);
}
