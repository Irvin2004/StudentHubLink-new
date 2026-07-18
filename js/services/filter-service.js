export function filterResources(resources, filters = {}) {
    return resources.filter((resource) => {
        const categoryMatches =
        !filters.category ||
        filters.category === "All" ||
        String(resource.category || "").toLowerCase() ===
            String(filters.category).toLowerCase();

        const price =
        Number(resource.price || 0);

        const priceMatches =
        !filters.price ||
        filters.price === "all" ||
        (filters.price === "free" && price === 0) ||
        (filters.price === "paid" && price > 0);

        return categoryMatches && priceMatches;
    });
}
