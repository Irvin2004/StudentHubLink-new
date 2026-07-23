"use strict";

import {
    CONVERSATION_PREFERENCES
} from "../config/conversation-preference-types.js";
import { escapeHtml } from "../utils/dom.js";

let activeMenu = null;
let activeTrigger = null;
const menuControllers = new Map();

function removeOpenListeners() {
    document.removeEventListener("pointerdown", handleOutsidePointer);
    document.removeEventListener("keydown", handleKeydown);
}

function addOpenListeners() {
    document.addEventListener("pointerdown", handleOutsidePointer);
    document.addEventListener("keydown", handleKeydown);
}

function handleOutsidePointer(event) {
    if (
        activeMenu?.contains(event.target) ||
        activeTrigger?.contains(event.target)
    ) {
        return;
    }

    closeConversationMenu();
}

function handleKeydown(event) {
    if (event.key !== "Escape") return;

    event.preventDefault();
    const trigger = activeTrigger;
    closeConversationMenu();
    trigger?.focus();
}

export function createConversationMenu({
    conversationId,
    preference = {}
} = {}) {
    const cleanConversationId = String(conversationId || "").trim();

    if (!cleanConversationId) {
        throw new Error("Conversation ID is required.");
    }

    const escapedId = escapeHtml(cleanConversationId);
    const pinLabel = preference.pinned ? "Unpin" : "Pin";
    const muteLabel = preference.muted ? "Unmute" : "Mute";
    const muteIcon = preference.muted ? "&#128276;" : "&#128277;";
    const archiveLabel = preference.archived
        ? "Move to Inbox"
        : "Archive";
    const archiveIcon = preference.archived ? "&#128228;" : "&#128229;";

    return `
        <button
            class="conversation-menu-trigger"
            type="button"
            data-conversation-menu-trigger
            data-conversation-id="${escapedId}"
            aria-label="Conversation actions"
            aria-haspopup="menu"
            aria-expanded="false"
        >&#8942;</button>
        <div
            class="conversation-menu"
            data-conversation-menu
            data-conversation-id="${escapedId}"
            role="menu"
            hidden
        >
            <button
                type="button"
                role="menuitem"
                data-conversation-action="${CONVERSATION_PREFERENCES.PINNED}"
                data-conversation-id="${escapedId}"
                aria-label="${pinLabel} conversation"
            >&#128204; ${pinLabel}</button>
            <button
                type="button"
                role="menuitem"
                data-conversation-action="${CONVERSATION_PREFERENCES.MUTED}"
                data-conversation-id="${escapedId}"
                aria-label="${muteLabel} conversation"
            >${muteIcon} ${muteLabel}</button>
            <button
                type="button"
                role="menuitem"
                data-conversation-action="${CONVERSATION_PREFERENCES.ARCHIVED}"
                data-conversation-id="${escapedId}"
                aria-label="${preference.archived
                    ? "Move conversation to inbox"
                    : "Archive conversation"}"
            >${archiveIcon} ${archiveLabel}</button>
        </div>
    `;
}

export function initializeConversationMenu(container, { onAction } = {}) {
    if (!container?.addEventListener) {
        throw new Error("Conversation menu container is required.");
    }

    if (typeof onAction !== "function") {
        throw new Error("Conversation menu action handler is required.");
    }

    menuControllers.get(container)?.destroy();

    const handleClick = async (event) => {
        if (!(event.target instanceof Element)) return;

        const trigger = event.target.closest(
            "[data-conversation-menu-trigger]"
        );

        if (trigger) {
            event.preventDefault();
            toggleConversationMenu(trigger);
            return;
        }

        const actionButton = event.target.closest(
            "[data-conversation-action]"
        );

        if (!actionButton) return;

        event.preventDefault();
        const detail = {
            action: actionButton.dataset.conversationAction,
            conversationId: actionButton.dataset.conversationId
        };

        actionButton.disabled = true;
        closeConversationMenu();

        try {
            await onAction(detail);
        } finally {
            if (actionButton.isConnected) actionButton.disabled = false;
        }
    };

    container.addEventListener("click", handleClick);

    const controller = {
        destroy() {
            container.removeEventListener("click", handleClick);
            closeConversationMenu();
            menuControllers.delete(container);
        }
    };

    menuControllers.set(container, controller);
    return controller;
}

export function openConversationMenu(trigger) {
    if (!trigger?.closest) {
        throw new Error("Conversation menu trigger is required.");
    }

    const entry = trigger.closest("[data-conversation-entry]");
    const menu = entry?.querySelector("[data-conversation-menu]");

    if (!menu) {
        throw new Error("Conversation menu is unavailable.");
    }

    closeConversationMenu();
    activeMenu = menu;
    activeTrigger = trigger;
    menu.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    addOpenListeners();
    menu.querySelector('[role="menuitem"]:not(:disabled)')?.focus();
    return menu;
}

export function closeConversationMenu() {
    if (activeMenu) activeMenu.hidden = true;
    activeTrigger?.setAttribute("aria-expanded", "false");
    removeOpenListeners();
    activeMenu = null;
    activeTrigger = null;
}

export function toggleConversationMenu(trigger) {
    const entry = trigger?.closest?.("[data-conversation-entry]");
    const menu = entry?.querySelector?.("[data-conversation-menu]");

    if (menu && menu === activeMenu && !menu.hidden) {
        closeConversationMenu();
        return null;
    }

    return openConversationMenu(trigger);
}

export function destroyConversationMenu() {
    closeConversationMenu();
    [...menuControllers.values()].forEach((controller) => {
        controller.destroy();
    });
}
