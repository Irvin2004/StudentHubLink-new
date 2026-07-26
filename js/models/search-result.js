"use strict";

export const SEARCH_RESULT_TYPES = Object.freeze({
    GROUP: "group",
    ASSIGNMENT: "assignment",
    RESOURCE: "resource",
    USER: "user"
});

export function createSearchResult({
    id,
    type,
    title,
    subtitle = "",
    url,
    icon = "🔎",
    metadata = {}
}) {
    const normalizedId = String(id || "").trim();
    const normalizedTitle = String(title || "").trim();
    const normalizedUrl = String(url || "").trim();

    if (!normalizedId) {
        throw new Error("Search result ID is required.");
    }

    if (!Object.values(SEARCH_RESULT_TYPES).includes(type)) {
        throw new Error("Invalid search result type.");
    }

    if (!normalizedTitle) {
        throw new Error("Search result title is required.");
    }

    if (!normalizedUrl) {
        throw new Error("Search result URL is required.");
    }

    return {
        id: normalizedId,
        type,
        title: normalizedTitle,
        subtitle: String(subtitle || "").trim(),
        url: normalizedUrl,
        icon: String(icon || "🔎"),
        metadata: { ...metadata }
    };
}
