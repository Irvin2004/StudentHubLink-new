"use strict";

function getDateValue(timestamp) {
    if (!timestamp) {
        return 0;
    }

    if (typeof timestamp.toDate === "function") {
        return timestamp.toDate().getTime();
    }

    const date = new Date(timestamp);

    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

/**
 * Returns a sorted copy of a resource collection.
 *
 * @param {Array<object>} resources
 * @param {string} sortBy
 * @returns {Array<object>}
 */
export function sortResources(resources = [], sortBy = "newest") {
    const sorted = [...resources];

    switch (sortBy) {
        case "oldest":
            return sorted.sort((first, second) =>
                getDateValue(first.createdAt) -
                getDateValue(second.createdAt)
            );

        case "downloads":
            return sorted.sort((first, second) =>
                Number(second.downloadCount || 0) -
                Number(first.downloadCount || 0)
            );

        case "price-low":
            return sorted.sort((first, second) =>
                Number(first.price || 0) -
                Number(second.price || 0)
            );

        case "price-high":
            return sorted.sort((first, second) =>
                Number(second.price || 0) -
                Number(first.price || 0)
            );

        case "title":
            return sorted.sort((first, second) =>
                String(first.title || "")
                    .localeCompare(String(second.title || ""))
            );

        case "newest":
        default:
            return sorted.sort((first, second) =>
                getDateValue(second.createdAt) -
                getDateValue(first.createdAt)
            );
    }
}
