function getDateValue(timestamp) {
    if (!timestamp) return 0;

    if (typeof timestamp.toDate === "function") {
        return timestamp.toDate().getTime();
    }

    const date =
    new Date(timestamp);

    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

export function sortResources(resources, sortBy = "newest") {
    const sorted =
    [...resources];

    switch (sortBy) {
        case "oldest":
            return sorted.sort((a, b) =>
                getDateValue(a.createdAt) -
                getDateValue(b.createdAt)
            );

        case "downloads":
            return sorted.sort((a, b) =>
                Number(b.downloadCount || 0) -
                Number(a.downloadCount || 0)
            );

        case "price-low":
            return sorted.sort((a, b) =>
                Number(a.price || 0) -
                Number(b.price || 0)
            );

        case "price-high":
            return sorted.sort((a, b) =>
                Number(b.price || 0) -
                Number(a.price || 0)
            );

        case "title":
            return sorted.sort((a, b) =>
                String(a.title || "")
                    .localeCompare(b.title || "")
            );

        case "newest":
        default:
            return sorted.sort((a, b) =>
                getDateValue(b.createdAt) -
                getDateValue(a.createdAt)
            );
    }
}
