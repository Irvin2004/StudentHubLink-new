"use strict";

import { PRESENCE_STATUS } from "../config/presence-status.js";

function isActiveTypingPresence(presence, currentConversationId) {
    const activeConversationId = String(currentConversationId || "").trim();

    return (
        presence?.status === PRESENCE_STATUS.TYPING &&
        activeConversationId !== "" &&
        String(presence?.conversationId || "").trim() === activeConversationId
    );
}

function getPresenceDisplay(presence = {}, currentConversationId = "") {
    if (isActiveTypingPresence(presence, currentConversationId)) {
        return {
            label: "Typing...",
            cssClass: PRESENCE_STATUS.TYPING
        };
    }

    if (
        presence.status === PRESENCE_STATUS.ONLINE ||
        presence.status === PRESENCE_STATUS.TYPING
    ) {
        return {
            label: "Online",
            cssClass: PRESENCE_STATUS.ONLINE
        };
    }

    return {
        label: "Offline",
        cssClass: PRESENCE_STATUS.OFFLINE
    };
}

function requireContainer(container) {
    if (!container || !("innerHTML" in container)) {
        throw new Error("Presence container is required.");
    }
}

export function renderPresence(
    presence,
    container,
    currentConversationId = ""
) {
    requireContainer(container);

    const html = isActiveTypingPresence(presence, currentConversationId)
        ? renderTypingIndicator(presence, currentConversationId)
        : renderPresenceBadge(presence, currentConversationId);

    container.innerHTML = html;
    return html;
}

export function renderPresenceBadge(presence = {}, currentConversationId = "") {
    const display = getPresenceDisplay(presence, currentConversationId);

    if (display.cssClass === PRESENCE_STATUS.TYPING) {
        return renderTypingIndicator(presence, currentConversationId);
    }

    return `
        <div
            class="presence-badge ${display.cssClass}"
            role="status"
            aria-label="${display.label}"
        >
            <span
                class="presence-dot ${display.cssClass}"
                aria-hidden="true"
            ></span>
            <span class="presence-label">${display.label}</span>
        </div>
    `;
}

export function renderTypingIndicator(
    presence = {},
    currentConversationId = ""
) {
    if (!isActiveTypingPresence(presence, currentConversationId)) {
        return renderPresenceBadge(presence, currentConversationId);
    }

    return `
        <div
            class="typing-indicator typing"
            role="status"
            aria-live="polite"
            aria-label="Typing..."
        >
            <span class="typing-dots" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
            </span>
            <span class="presence-label">Typing...</span>
        </div>
    `;
}

export function clearPresence(container) {
    requireContainer(container);
    container.innerHTML = "";
}
