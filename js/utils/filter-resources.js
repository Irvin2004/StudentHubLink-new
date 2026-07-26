"use strict";

/**
 * Filters resources by category and price without mutating the input.
 *
 * @param {Array<object>} resources
 * @param {{category?: string, price?: string}} filters
 * @returns {Array<object>}
 */
export function filterResources(resources = [], filters = {}) {
    return resources.filter((resource) => {
        const categoryMatches =
            !filters.category ||
            filters.category === "All" ||
            String(resource.category || "").toLowerCase() ===
                String(filters.category).toLowerCase();

        const price = Number(resource.price || 0);
        const priceMatches =
            !filters.price ||
            filters.price === "all" ||
            (filters.price === "free" && price === 0) ||
            (filters.price === "paid" && price > 0);

        return categoryMatches && priceMatches;
    });
}
