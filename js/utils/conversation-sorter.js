"use strict";

function getConversation(value = {}) {
    return value.conversation || value;
}

function createPreferenceMap(preferences) {
    if (preferences instanceof Map) return preferences;

    if (Array.isArray(preferences)) {
        return new Map(preferences.map((preference) => [
            preference.conversationId,
            preference
        ]));
    }

    return new Map(Object.entries(preferences || {}));
}

function getActivityTime(value) {
    const activity = getConversation(value).lastMessageAt;

    if (typeof activity?.toMillis === "function") return activity.toMillis();
    if (activity instanceof Date) return activity.getTime();

    const numericTime = Number(activity);
    if (Number.isFinite(numericTime)) return numericTime;

    const parsedTime = Date.parse(activity);
    return Number.isFinite(parsedTime) ? parsedTime : 0;
}

function getTitle(value) {
    const conversation = getConversation(value);
    const displayUser = value.otherUser || {};

    return String(
        displayUser.fullName ||
        displayUser.name ||
        displayUser.displayName ||
        conversation.title ||
        conversation.name ||
        conversation.id ||
        ""
    ).trim();
}

export function compareConversations(
    conversationA,
    conversationB,
    preferences = new Map(),
    { prioritizePinned = true } = {}
) {
    const preferenceMap = createPreferenceMap(preferences);
    const first = getConversation(conversationA);
    const second = getConversation(conversationB);

    if (prioritizePinned) {
        const firstPinned = Boolean(preferenceMap.get(first.id)?.pinned);
        const secondPinned = Boolean(preferenceMap.get(second.id)?.pinned);

        if (firstPinned !== secondPinned) return firstPinned ? -1 : 1;
    }

    const activityDifference = getActivityTime(conversationB) -
        getActivityTime(conversationA);

    if (activityDifference !== 0) return activityDifference;

    const titleDifference = getTitle(conversationA).localeCompare(
        getTitle(conversationB),
        undefined,
        { sensitivity: "base", numeric: true }
    );

    if (titleDifference !== 0) return titleDifference;

    return String(first.id || "").localeCompare(
        String(second.id || ""),
        undefined,
        { sensitivity: "base", numeric: true }
    );
}

export function sortConversations(
    conversations = [],
    preferences = new Map(),
    options = {}
) {
    const preferenceMap = createPreferenceMap(preferences);

    return [...conversations].sort((first, second) =>
        compareConversations(first, second, preferenceMap, options)
    );
}
