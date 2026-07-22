"use strict";

import {
    REACTION_TYPES,
    isValidReaction
} from "../config/reaction-types.js";
import { escapeHtml } from "../utils/dom.js";

const REACTION_LABELS = Object.freeze({
    [REACTION_TYPES.LIKE]: "thumbs up",
    [REACTION_TYPES.LOVE]: "heart",
    [REACTION_TYPES.LAUGH]: "laughing",
    [REACTION_TYPES.WOW]: "surprised",
    [REACTION_TYPES.CELEBRATE]: "celebration"
});

function requireContainer(container) {
    if (!container || !("innerHTML" in container)) {
        throw new Error("Reaction container is required.");
    }
}

function groupReactions(reactions = []) {
    const grouped = new Map();

    (Array.isArray(reactions) ? reactions : []).forEach((item) => {
        const emoji = item?.reaction;
        const userId = String(item?.userId || "").trim();

        if (!isValidReaction(emoji) || !userId) return;

        if (!grouped.has(emoji)) {
            grouped.set(emoji, {
                emoji,
                count: 0,
                users: []
            });
        }

        const group = grouped.get(emoji);

        if (!group.users.includes(userId)) {
            group.users.push(userId);
            group.count += 1;
        }
    });

    return Array.from(grouped.values());
}

function getReactionLabel(emoji, count, selected) {
    const name = REACTION_LABELS[emoji] || "emoji";

    if (selected) {
        return `${name} reaction, selected, ${count} total ${
            count === 1 ? "reaction" : "reactions"
        }`;
    }

    return `${count} ${name} ${
        count === 1 ? "reaction" : "reactions"
    }`;
}

export function renderReactionChip(
    emoji,
    count,
    reactedByCurrentUser,
    messageId = ""
) {
    if (!isValidReaction(emoji) || !Number.isInteger(count) || count < 1) {
        return "";
    }

    const mine = reactedByCurrentUser === true;

    return `
        <button
            class="reaction-chip${mine ? " mine" : ""}"
            type="button"
            data-message-id="${escapeHtml(messageId)}"
            data-reaction="${escapeHtml(emoji)}"
            data-emoji="${escapeHtml(emoji)}"
            aria-label="${escapeHtml(
                getReactionLabel(emoji, count, mine)
            )}"
            aria-pressed="${mine}"
        >
            <span class="reaction-emoji" aria-hidden="true">
                ${escapeHtml(emoji)}
            </span>
            <span class="reaction-count">${count}</span>
        </button>
    `;
}

export function renderReactionBar(
    reactions,
    currentUserId,
    container
) {
    requireContainer(container);

    const groups = groupReactions(reactions);

    if (!groups.length) {
        clearReactionBar(container);
        return "";
    }

    const cleanCurrentUserId = String(currentUserId || "").trim();
    const messageId = String(container.dataset?.messageId || "").trim();
    const html = groups.map((group) => renderReactionChip(
        group.emoji,
        group.count,
        group.users.includes(cleanCurrentUserId),
        messageId
    )).join("");

    container.classList?.add("reaction-bar");
    container.removeAttribute?.("hidden");
    container.innerHTML = html;

    return html;
}

export function clearReactionBar(container) {
    requireContainer(container);
    container.innerHTML = "";
    container.classList?.remove("reaction-bar");
    container.setAttribute?.("hidden", "");
}
