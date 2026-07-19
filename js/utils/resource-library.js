function getTimestampValue(value) {
    if (typeof value?.toMillis === "function") return value.toMillis();
    if (value instanceof Date) return value.getTime();
    return new Date(value || 0).getTime() || 0;
}

export function filterAndSortResources(
    resources,
    { search = "", category = "all", sort = "newest" } = {}
) {
    const searchTerm = search.trim().toLowerCase();

    return [...resources]
        .filter((resource) => {
            const matchesSearch =
                !searchTerm ||
                (resource.title || "")
                    .toLowerCase()
                    .includes(searchTerm) ||
                (resource.description || "")
                    .toLowerCase()
                    .includes(searchTerm);
            const matchesCategory =
                category === "all" || resource.category === category;

            return matchesSearch && matchesCategory;
        })
        .sort((first, second) => {
            if (sort === "downloads") {
                return Number(second.downloadCount || 0) -
                    Number(first.downloadCount || 0);
            }

            const difference = getTimestampValue(second.createdAt) -
                getTimestampValue(first.createdAt);

            return sort === "oldest" ? -difference : difference;
        });
}