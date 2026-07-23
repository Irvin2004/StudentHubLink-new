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
    bindContextMenuInteractions,
    createContextMenu,
    destroyContextMenu
} from "../components/context-menu.js";
import { openLeaveGroupDialog } from "../components/leave-group-dialog.js";
import { leaveStudyGroup } from "../services/group-service.js";
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

    const getContext = (entry) => ({
        conversationId: validateId(
            entry?.dataset.conversationId,
            "Conversation ID"
        ),
        type: entry.dataset.conversationType || "direct",
        groupId: entry.dataset.groupId || "",
        otherUserId: entry.dataset.otherUserId || "",
        label: entry.dataset.conversationLabel || "Conversation"
    });

    const getMenuItems = (context) => {
        const preference = preferences.get(context.conversationId) || {};
        const isGroup = context.type === "group";

        return [
            {
                id: CONVERSATION_PREFERENCES.PINNED,
                label: preference.pinned
                    ? "Unpin conversation"
                    : "Pin conversation",
                icon: preference.pinned ? "📍" : "📌"
            },
            {
                id: CONVERSATION_PREFERENCES.MUTED,
                label: preference.muted
                    ? "Unmute conversation"
                    : "Mute conversation",
                icon: preference.muted ? "🔔" : "🔕"
            },
            {
                id: CONVERSATION_PREFERENCES.ARCHIVED,
                label: preference.archived
                    ? "Move conversation to inbox"
                    : "Archive conversation",
                icon: preference.archived ? "📤" : "📥"
            },
            {
                id: "details",
                label: "View conversation details",
                icon: "ℹ️",
                separatorBefore: true
            },
            {
                id: isGroup ? "leave" : "delete",
                label: isGroup
                    ? "Leave conversation"
                    : "Delete conversation",
                icon: "🗑️",
                danger: true,
                disabled: !isGroup,
                title: isGroup
                    ? "Leave this study group"
                    : "Per-user conversation deletion is not available yet"
            }
        ];
    };

    const handleAction = async (action, context) => {
        const preference = preferences.get(context.conversationId);

        try {
            if (action === CONVERSATION_PREFERENCES.PINNED) {
                if (preference?.pinned) {
                    await unpinConversation(cleanUserId, context.conversationId);
                } else {
                    await pinConversation(cleanUserId, context.conversationId);
                }
                return;
            }

            if (action === CONVERSATION_PREFERENCES.MUTED) {
                await toggleMuteConversation(
                    cleanUserId,
                    context.conversationId
                );
                return;
            }

            if (action === CONVERSATION_PREFERENCES.ARCHIVED) {
                await toggleArchiveConversation(
                    cleanUserId,
                    context.conversationId
                );
                return;
            }

            if (action === "details") {
                const page = context.type === "group"
                    ? `group-details.html?id=${encodeURIComponent(context.groupId)}`
                    : `user-profile.html?id=${encodeURIComponent(context.otherUserId)}`;
                window.location.href = page;
                return;
            }

            if (action === "leave") {
                const confirmed = await openLeaveGroupDialog(context.label);
                if (!confirmed) return;

                await leaveStudyGroup({
                    groupId: context.groupId,
                    userId: cleanUserId
                });
            }
        } catch (error) {
            const messages = {
                [CONVERSATION_PREFERENCES.PINNED]:
                    `Unable to ${preference?.pinned ? "unpin" : "pin"} conversation.`,
                [CONVERSATION_PREFERENCES.MUTED]:
                    `Unable to ${preference?.muted ? "unmute" : "mute"} conversation.`,
                [CONVERSATION_PREFERENCES.ARCHIVED]:
                    `Unable to ${preference?.archived ? "restore" : "archive"} conversation.`,
                leave: "Unable to leave conversation."
            };
            reportError(error, messages[action] || "Unable to update conversation.");
        }
    };

    const openMenu = (entry, anchor, coordinates = {}) => {
        const context = getContext(entry);
        const menu = createContextMenu({
            items: getMenuItems(context),
            anchor,
            onSelect: (action) => handleAction(action, context)
        });
        menu.open({ anchor, ...coordinates });
    };

    const handleClick = (event) => {
        const trigger = event.target.closest?.(
            "[data-conversation-menu-trigger]"
        );

        if (!trigger) return;
        event.preventDefault();
        openMenu(trigger.closest("[data-conversation-entry]"), trigger);
    };

    const destroyContextMenuInteractions =
        bindContextMenuInteractions({
            container,
            targetSelector: "[data-conversation-entry]",
            onOpen({ target: entry, x, y }) {
                const trigger = entry.querySelector(
                    "[data-conversation-menu-trigger]"
                );
                openMenu(entry, trigger, { x, y });
            }
        });

    container.addEventListener("click", handleClick);

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
            destroyContextMenuInteractions();
            destroyContextMenu();
            container.removeEventListener("click", handleClick);
            unsubscribe();
        },
        getPreferences() {
            return new Map(preferences);
        }
    };
}
