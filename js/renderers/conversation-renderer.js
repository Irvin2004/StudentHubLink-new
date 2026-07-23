"use strict";

import {
    createConversationItem
} from "../components/conversation-item.js?context-menu=1";
import {
    createEmptyState
} from "../components/empty-state.js?empty-states=1";
import {
    hideSkeleton,
    showSkeleton
} from "./skeleton-renderer.js";
import {
    SKELETON_TYPES
} from "../config/skeleton-types.js";

function getPreference(preferences, conversationId) {
    if (preferences instanceof Map) {
        return preferences.get(conversationId) || {};
    }

    return preferences?.[conversationId] || {};
}

export function renderConversationList({
    items = [],
    currentUserId,
    container,
    preferences = new Map(),
    showPinnedDivider = true,
    emptyTitle = "No conversations yet",
    emptyMessage =
        "Follow each other with another student to start messaging."
} = {}) {
    if (!container || !("innerHTML" in container)) {
        throw new Error("Conversation list container is required.");
    }

    if (container.querySelector?.("[data-skeleton-root]")) {
        hideSkeleton(container);
    }

    if (!items.length) {
        container.setAttribute?.("aria-busy", "false");
        container.innerHTML = createEmptyState(
            emptyTitle,
            emptyMessage,
            "&#128172;"
        );
        return;
    }

    container.setAttribute?.("aria-busy", "false");
    let previousPinned = null;

    container.innerHTML = items.map(({ conversation, otherUser }) => {
        const preference = getPreference(preferences, conversation.id);
        const pinned = preference.pinned === true;
        const divider = showPinnedDivider &&
            previousPinned === true && !pinned
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

export function renderConversationLoading(container) {
    if (!container || !("innerHTML" in container)) {
        throw new Error("Conversation list container is required.");
    }

    showSkeleton(container, SKELETON_TYPES.MESSAGE);
}

export function renderConversationError(container) {
    if (!container || !("innerHTML" in container)) {
        throw new Error("Conversation list container is required.");
    }

    if (container.querySelector?.("[data-skeleton-root]")) {
        hideSkeleton(container);
    }

    container.setAttribute?.("aria-busy", "false");
    container.innerHTML = createEmptyState(
        "Conversations unavailable",
        "We couldn't load your conversations. Check your connection and try again.",
        "&#9888;"
    );
}
