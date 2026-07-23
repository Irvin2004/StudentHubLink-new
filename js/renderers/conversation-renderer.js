"use strict";

import {
    createConversationItem
} from "../components/conversation-item.js?preferences=2";
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

export function sortConversationItems(items = [], preferences = new Map()) {
    return [...items].sort((first, second) => {
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
    emptyTitle = "No conversations yet",
    emptyMessage =
        "Follow each other with another student to start messaging."
} = {}) {
    if (!container || !("innerHTML" in container)) {
        throw new Error("Conversation list container is required.");
    }

    if (!items.length) {
        container.innerHTML = createEmptyState(
            emptyTitle,
            emptyMessage,
            "&#128172;"
        );
        return;
    }

    const sortedItems = sortConversationItems(items, preferences);
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
