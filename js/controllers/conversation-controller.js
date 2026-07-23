"use strict";

import {
    pinConversation,
    subscribeToConversationPreferences,
    toggleArchiveConversation,
    toggleMuteConversation,
    unpinConversation
} from "../services/conversation-service.js?preferences=5";
import {
    CONVERSATION_PREFERENCES
} from "../config/conversation-preference-types.js";
import {
    initializeConversationMenu
} from "../components/conversation-menu.js?preferences=2";
import { sortConversations } from "../utils/conversation-sorter.js";

function validateId(value, label) {
    const normalized = String(value || "").trim();
    if (!normalized) throw new Error(`${label} is required.`);
    return normalized;
}

export function prepareConversations({
    conversations = [],
    preferences = new Map(),
    view = "inbox"
} = {}) {
    const preferenceMap = preferences instanceof Map
        ? preferences
        : new Map(Object.entries(preferences || {}));
    const visibleConversations = view === "search"
        ? [...conversations]
        : conversations.filter((item) => {
            const conversation = item.conversation || item;
            const archived = Boolean(
                preferenceMap.get(conversation.id)?.archived
            );
            return archived === (view === "archived");
        });

    return sortConversations(visibleConversations, preferenceMap, {
        prioritizePinned: view !== "archived"
    });
}

export function initializeConversationPreferences({
    userId,
    container,
    onPreferencesChange = () => {},
    onError = () => {}
} = {}) {
    const cleanUserId = validateId(userId, "User ID");
    let preferences = new Map();

    const reportError = (error, message) => {
        onError(error, message);
    };

    const menuController = initializeConversationMenu(container, {
        async onAction({ action, conversationId }) {
            const cleanConversationId = validateId(
                conversationId,
                "Conversation ID"
            );
            const preference = preferences.get(cleanConversationId);

            try {
                if (action === CONVERSATION_PREFERENCES.PINNED) {
                    if (preference?.pinned) {
                        await unpinConversation(cleanUserId, cleanConversationId);
                    } else {
                        await pinConversation(cleanUserId, cleanConversationId);
                    }
                    return;
                }

                if (action === CONVERSATION_PREFERENCES.MUTED) {
                    await toggleMuteConversation(
                        cleanUserId,
                        cleanConversationId
                    );
                    return;
                }

                if (action === CONVERSATION_PREFERENCES.ARCHIVED) {
                    await toggleArchiveConversation(
                        cleanUserId,
                        cleanConversationId
                    );
                }
            } catch (error) {
                const changingMute = action === CONVERSATION_PREFERENCES.MUTED;
                const changingArchive =
                    action === CONVERSATION_PREFERENCES.ARCHIVED;
                reportError(
                    error,
                    changingArchive
                        ? `Unable to ${preference?.archived ? "restore" : "archive"} conversation.`
                        : changingMute
                        ? `Unable to ${preference?.muted ? "unmute" : "mute"} conversation.`
                        : `Unable to ${preference?.pinned ? "unpin" : "pin"} conversation.`
                );
            }
        }
    });

    const unsubscribe = subscribeToConversationPreferences(
        cleanUserId,
        (items) => {
            preferences = new Map(items.map((preference) => [
                preference.conversationId,
                preference
            ]));
            onPreferencesChange(new Map(preferences));
        },
        (error) => {
            preferences = new Map();
            onPreferencesChange(new Map());
            reportError(error, "Unable to load conversation preferences.");
        }
    );

    return {
        destroy() {
            menuController.destroy();
            unsubscribe();
        },
        getPreferences() {
            return new Map(preferences);
        }
    };
}
