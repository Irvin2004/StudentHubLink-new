export const ACTIVITY_TYPES = Object.freeze({
    ANNOUNCEMENT_POSTED: "announcement_posted",
    CHANNEL_CREATED: "channel_created",
    FILE_UPLOADED: "file_uploaded",
    MEMBER_JOINED: "member_joined"
});

export const ACTIVITY_TYPE_VALUES = Object.freeze(
    Object.values(ACTIVITY_TYPES)
);

export function isActivityType(value) {
    return ACTIVITY_TYPE_VALUES.includes(value);
}
