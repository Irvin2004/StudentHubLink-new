"use strict";

import {
    CONVERSATION_PREFERENCES
} from "../config/conversation-preference-types.js";
import { escapeHtml } from "../utils/dom.js";

let activeMenu = null;
let activeTrigger = null;

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
            >&#128204; ${pinLabel}</button>
            <button
                type="button"
                role="menuitem"
                disabled
                aria-disabled="true"
                title="Mute conversations is coming next"
            >&#128277; Mute</button>
            <button
                type="button"
                role="menuitem"
                disabled
                aria-disabled="true"
                title="Archive conversations is coming next"
            >&#128229; Archive</button>
        </div>
    `;
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
}
