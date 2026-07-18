export function searchResources(resources, searchTerm) {
    const term =
    String(searchTerm || "").trim().toLowerCase();

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
            String(field || "").toLowerCase().includes(term)
        );
    });
}
