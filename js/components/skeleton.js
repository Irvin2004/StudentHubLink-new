"use strict";

import { SKELETON_TYPES } from "../config/skeleton-types.js";

const DEFAULT_COUNTS = Object.freeze({
    [SKELETON_TYPES.MESSAGE]: 8,
    [SKELETON_TYPES.COMMUNITY]: 3,
    [SKELETON_TYPES.CHANNEL]: 4,
    [SKELETON_TYPES.USER]: 4,
    [SKELETON_TYPES.PROFILE]: 1,
    [SKELETON_TYPES.FILE]: 6,
    [SKELETON_TYPES.NOTIFICATION]: 3
});

function normalizeType(type) {
    const normalizedType = String(type || "")
        .trim()
        .toLowerCase();

    if (!Object.hasOwn(DEFAULT_COUNTS, normalizedType)) {
        throw new TypeError(`Unsupported skeleton type: ${type}`);
    }

    return normalizedType;
}

function normalizeCount(type, count) {
    if (count === undefined) {
        return DEFAULT_COUNTS[type];
    }

    const numericCount = Number(count);

    if (!Number.isInteger(numericCount) || numericCount < 1) {
        throw new TypeError("Skeleton count must be a positive integer.");
    }

    return Math.min(numericCount, 12);
}

function line(size = "full") {
    return `<span class="skeleton skeleton__line skeleton__line--${size}"></span>`;
}

function createMessageItem(index) {
    return `
        <div class="skeleton-item skeleton-message${
            index % 3 === 2 ? " skeleton-message--outgoing" : ""
        }">
            <span class="skeleton skeleton__avatar"></span>
            <span class="skeleton__content">
                ${line(index % 2 === 0 ? "long" : "medium")}
                ${line("short")}
            </span>
        </div>
    `;
}

function createListItem(type) {
    const iconClass = type === SKELETON_TYPES.CHANNEL
        ? "skeleton__icon skeleton__icon--square"
        : "skeleton__avatar";

    return `
        <div class="skeleton-item skeleton-list-item">
            <span class="skeleton ${iconClass}"></span>
            <span class="skeleton__content">
                ${line("medium")}
                ${line("short")}
            </span>
        </div>
    `;
}

function createProfileItem() {
    return `
        <div class="skeleton-item skeleton-profile">
            <span class="skeleton skeleton__avatar skeleton__avatar--large"></span>
            <span class="skeleton__content">
                ${line("medium")}
                ${line("short")}
                ${line("long")}
            </span>
        </div>
    `;
}

function createFileItem() {
    return `
        <div class="skeleton-item skeleton-file">
            <span class="skeleton skeleton__file-preview"></span>
            <span class="skeleton__content">
                ${line("long")}
                ${line("medium")}
                ${line("short")}
            </span>
        </div>
    `;
}

function createNotificationItem() {
    return `
        <div class="skeleton-item skeleton-notification">
            <span class="skeleton skeleton__icon"></span>
            <span class="skeleton__content">
                ${line("long")}
                ${line("medium")}
            </span>
        </div>
    `;
}

function createItem(type, index) {
    switch (type) {
        case SKELETON_TYPES.MESSAGE:
            return createMessageItem(index);
        case SKELETON_TYPES.PROFILE:
            return createProfileItem();
        case SKELETON_TYPES.FILE:
            return createFileItem();
        case SKELETON_TYPES.NOTIFICATION:
            return createNotificationItem();
        case SKELETON_TYPES.COMMUNITY:
        case SKELETON_TYPES.CHANNEL:
        case SKELETON_TYPES.USER:
            return createListItem(type);
        default:
            return "";
    }
}

export function createSkeleton(type, options = {}) {
    const normalizedType = normalizeType(type);
    const count = normalizeCount(normalizedType, options.count);
    const layoutClass = normalizedType;
    const items = Array.from(
        { length: count },
        (_, index) => createItem(normalizedType, index)
    ).join("");

    return `
        <div
            class="skeleton-layout skeleton-layout--${layoutClass}"
            data-skeleton-root
            data-skeleton-type="${normalizedType}"
            aria-hidden="true">
            ${items}
        </div>
    `;
}
