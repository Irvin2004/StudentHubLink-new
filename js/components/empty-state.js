"use strict";

import { EMPTY_STATE_TYPES } from "../config/empty-state-types.js";
import { escapeHtml } from "../utils/dom.js";

const EMPTY_STATE_DEFAULTS = Object.freeze({
    [EMPTY_STATE_TYPES.MESSAGES]: Object.freeze({
        icon: "💬",
        title: "No messages yet",
        description: "Start the conversation by sending the first message."
    }),
    [EMPTY_STATE_TYPES.COMMUNITIES]: Object.freeze({
        icon: "👥",
        title: "You're not part of any communities yet.",
        description: "Create one or join an existing community."
    }),
    [EMPTY_STATE_TYPES.CHANNELS]: Object.freeze({
        icon: "#",
        title: "No channels available.",
        description: "Create the first channel."
    }),
    [EMPTY_STATE_TYPES.SEARCH]: Object.freeze({
        icon: "🔍",
        title: "No results found.",
        description: "Try different keywords."
    }),
    [EMPTY_STATE_TYPES.FILES]: Object.freeze({
        icon: "📁",
        title: "No files have been shared yet.",
        description: "Upload the first file."
    }),
    [EMPTY_STATE_TYPES.NOTIFICATIONS]: Object.freeze({
        icon: "🔔",
        title: "You're all caught up!",
        description: "No new notifications."
    }),
    [EMPTY_STATE_TYPES.FRIENDS]: Object.freeze({
        icon: "👤",
        title: "No contacts yet.",
        description: "Invite classmates to connect."
    })
});

function normalizeLegacyIcon(icon) {
    const numericEntity = /^&#(\d+);$/.exec(String(icon || ""));

    if (numericEntity) {
        return String.fromCodePoint(Number(numericEntity[1]));
    }

    return icon;
}

function normalizeOptions(titleOrOptions, description, icon) {
    if (typeof titleOrOptions === "object" && titleOrOptions) {
        return { ...titleOrOptions };
    }

    return {
        title: titleOrOptions,
        description,
        icon: normalizeLegacyIcon(icon)
    };
}

function getDefaults(type) {
    if (type === undefined || type === null || type === "") {
        return {
            icon: "📭",
            title: "Nothing here yet",
            description: "New content will appear here."
        };
    }

    if (!Object.values(EMPTY_STATE_TYPES).includes(type)) {
        throw new TypeError(`Unsupported empty state type: ${type}`);
    }

    return EMPTY_STATE_DEFAULTS[type];
}

/**
 * Creates accessible empty-state markup with an optional action.
 *
 * @param {string|object} titleOrOptions
 * @param {string} [description]
 * @param {string} [icon]
 * @returns {string}
 */
export function createEmptyState(titleOrOptions, description, icon = "📭") {
    const options = normalizeOptions(titleOrOptions, description, icon);
    const defaults = getDefaults(options.type);
    const resolvedType = options.type || "custom";
    const resolvedIcon = options.icon || defaults.icon;
    const resolvedTitle = options.title || defaults.title;
    const resolvedDescription =
        options.description || options.message || defaults.description;
    const action = options.action;
    const actionMarkup = action?.label
        ? `
            <button
                class="empty-state__action btn btn-primary"
                type="button"
                data-empty-state-action
                aria-label="${escapeHtml(action.ariaLabel || action.label)}">
                ${escapeHtml(action.label)}
            </button>
        `
        : "";

    return `
        <section
            class="empty-state"
            data-empty-state-root
            data-empty-state-type="${escapeHtml(resolvedType)}"
            role="status"
            aria-live="polite"
            aria-atomic="true">
            <span class="empty-state__icon" aria-hidden="true">
                ${escapeHtml(resolvedIcon)}
            </span>

            <h2 class="empty-state__title">
                ${escapeHtml(resolvedTitle)}
            </h2>

            <p class="empty-state__description">
                ${escapeHtml(resolvedDescription)}
            </p>

            ${actionMarkup}
        </section>
    `;
}
