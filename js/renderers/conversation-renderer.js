"use strict";

import {
    createConversationItem
} from "../components/conversation-item.js?preferences=4";
import { createEmptyState } from "../components/empty-state.js";

function getPreference(preferences, conversationId) {
    if (preferences instanceof Map) {
        return preferences.get(conversationId) || {};
    }

    return preferences?.[conversationId] || {};
}

function getActivityTime(conversation) {
    const value = conversation?.lastMessageAt;

    if (typeof value?.toMillis === "function") return value.toMillis();
    if (value instanceof Date) return value.getTime();

    const timestamp = Number(value);
    return Number.isFinite(timestamp) ? timestamp : 0;
}

export function filterConversationItems(
    items = [],
    preferences = new Map(),
    view = "inbox"
) {
    if (view === "search") return [...items];

    const showArchived = view === "archived";
    return items.filter(({ conversation }) =>
        Boolean(getPreference(preferences, conversation.id).archived) ===
            showArchived
    );
}

export function sortConversationItems(
    items = [],
    preferences = new Map(),
    view = "inbox"
) {
    return [...items].sort((first, second) => {
        if (view === "archived") {
            return getActivityTime(second.conversation) -
                getActivityTime(first.conversation);
        }

        const firstPinned = Boolean(
            getPreference(preferences, first.conversation.id).pinned
        );
        const secondPinned = Boolean(
            getPreference(preferences, second.conversation.id).pinned
        );

        if (firstPinned !== secondPinned) {
            return firstPinned ? -1 : 1;
        }

        return getActivityTime(second.conversation) -
            getActivityTime(first.conversation);
    });
}

export function renderConversationList({
    items = [],
    currentUserId,
    container,
    preferences = new Map(),
    view = "inbox",
    emptyTitle = "No conversations yet",
    emptyMessage =
        "Follow each other with another student to start messaging."
} = {}) {
    if (!container || !("innerHTML" in container)) {
        throw new Error("Conversation list container is required.");
    }

    const visibleItems = filterConversationItems(items, preferences, view);

    if (!visibleItems.length) {
        container.innerHTML = createEmptyState(
            emptyTitle,
            emptyMessage,
            "&#128172;"
        );
        return;
    }

    const sortedItems = sortConversationItems(
        visibleItems,
        preferences,
        view
    );
    let previousPinned = null;

    container.innerHTML = sortedItems.map(({ conversation, otherUser }) => {
        const preference = getPreference(preferences, conversation.id);
        const pinned = preference.pinned === true;
        const divider = previousPinned === true && !pinned
            ? '<div class="conversation-section-divider" aria-hidden="true"></div>'
            : "";

        previousPinned = pinned;

        return `${divider}${createConversationItem(
            conversation,
            currentUserId,
            otherUser,
            preference
        )}`;
    }).join("");
}

export function renderConversationError(container) {
    if (!container || !("innerHTML" in container)) {
        throw new Error("Conversation list container is required.");
    }

    container.innerHTML = createEmptyState(
        "Conversations unavailable",
        "We couldn't load your conversations. Check your connection and try again.",
        "&#9888;"
    );
}
