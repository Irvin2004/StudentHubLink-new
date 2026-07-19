export const RESOURCE_CATEGORIES = Object.freeze({
    NOTES: "notes",
    ASSIGNMENTS: "assignments",
    PAST_PAPERS: "past-papers",
    MEMORANDUMS: "memorandums",
    PRACTICALS: "practicals",
    PROJECTS: "projects",
    BOOKS: "books",
    OTHER: "other"
});

export const RESOURCE_CATEGORY_OPTIONS = Object.freeze([
    { value: RESOURCE_CATEGORIES.NOTES, label: "Notes" },
    { value: RESOURCE_CATEGORIES.ASSIGNMENTS, label: "Assignments" },
    { value: RESOURCE_CATEGORIES.PAST_PAPERS, label: "Past Papers" },
    { value: RESOURCE_CATEGORIES.MEMORANDUMS, label: "Memorandums" },
    { value: RESOURCE_CATEGORIES.PRACTICALS, label: "Practicals" },
    { value: RESOURCE_CATEGORIES.PROJECTS, label: "Projects" },
    { value: RESOURCE_CATEGORIES.BOOKS, label: "Books" },
    { value: RESOURCE_CATEGORIES.OTHER, label: "Other" }
]);

export function isValidResourceCategory(category) {
    return RESOURCE_CATEGORY_OPTIONS.some(
        (option) => option.value === category
    );
}

export function getResourceCategoryLabel(category) {
    return RESOURCE_CATEGORY_OPTIONS.find(
        (option) => option.value === category
    )?.label || "Other";
}