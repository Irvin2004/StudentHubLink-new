"use strict";

/**
 * Normalizes user-entered search text for stable comparisons.
 *
 * @param {unknown} query
 * @returns {string}
 */
export function normalizeSearchQuery(query) {
    return String(query || "")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();
}

/**
 * Filters a resource collection using normalized text matching.
 *
 * @param {Array<object>} resources
 * @param {unknown} searchTerm
 * @returns {Array<object>}
 */
export function searchResources(resources = [], searchTerm) {
    const term = normalizeSearchQuery(searchTerm);

    if (!term) {
        return [...resources];
    }

    return resources.filter((resource) => {
        const searchableFields = [
            resource.title,
            resource.description,
            resource.category,
            resource.ownerName
        ];

        return searchableFields.some((field) =>
            String(field || "")
                .toLowerCase()
                .includes(term)
        );
    });
}
