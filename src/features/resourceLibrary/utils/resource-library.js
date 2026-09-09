const TYPE_LABELS = Object.freeze({
    document: "Document",
    image: "Image",
    other: "Other",
    pdf: "PDF",
    presentation: "Presentation",
    spreadsheet: "Spreadsheet"
});

const IMAGE_EXTENSIONS = new Set(["gif", "jpeg", "jpg", "png", "webp"]);
const DOCUMENT_EXTENSIONS = new Set(["doc", "docx", "txt"]);
const SPREADSHEET_EXTENSIONS = new Set(["csv", "xls", "xlsx"]);
const PRESENTATION_EXTENSIONS = new Set(["ppt", "pptx"]);

export const RESOURCE_ACTIONS = Object.freeze({
    ADD_TO_PLANNER: "add-to-planner",
    CREATE_FLASHCARD_DECK: "create-flashcard-deck",
    DOWNLOAD: "download",
    OPEN: "open",
    PREVIEW: "preview",
    START_SESSION: "start-session",
    STUDY_WITH_THUTO: "study-with-thuto",
    TOGGLE_FAVORITE: "toggle-favorite"
});

export function getResourceType(resource) {
    const extension = String(resource?.extension || "").toLowerCase();
    if (extension === "pdf") return "pdf";
    if (IMAGE_EXTENSIONS.has(extension)) return "image";
    if (DOCUMENT_EXTENSIONS.has(extension)) return "document";
    if (SPREADSHEET_EXTENSIONS.has(extension)) return "spreadsheet";
    if (PRESENTATION_EXTENSIONS.has(extension)) return "presentation";
    return "other";
}

export function getResourceTypeLabel(resource) {
    return TYPE_LABELS[getResourceType(resource)];
}

export function resourceTimestamp(value) {
    if (typeof value?.toMillis === "function") return value.toMillis();
    if (typeof value?.toDate === "function") return value.toDate().getTime();
    if (value instanceof Date) return value.getTime();

    const timestamp = new Date(value || 0).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
}

export function selectRecentResources(
    resources,
    limit = RECENT_RESOURCE_LIMIT
) {
    return [...resources]
        .filter((resource) => resourceTimestamp(resource.lastOpened) > 0)
        .sort(
            (first, second) =>
                resourceTimestamp(second.lastOpened) -
                resourceTimestamp(first.lastOpened)
        )
        .slice(0, limit);
}

export function selectFavoriteResources(resources, favorites, limit = 3) {
    return [...resources]
        .filter((resource) => Boolean(favorites?.[resource.resourceKey]))
        .sort((first, second) => {
            const favoriteDifference =
                resourceTimestamp(second.favoriteAt) -
                resourceTimestamp(first.favoriteAt);
            if (favoriteDifference) return favoriteDifference;

            const openedDifference =
                resourceTimestamp(second.lastOpened) -
                resourceTimestamp(first.lastOpened);
            if (openedDifference) return openedDifference;

            return first.title.localeCompare(second.title, undefined, {
                sensitivity: "base"
            });
        })
        .slice(0, limit);
}

export function getResourceDashboardData(
    resources,
    favorites,
    recentLimit = 3
) {
    return {
        favoriteResources: selectFavoriteResources(resources, favorites),
        recentResources: selectRecentResources(resources, recentLimit),
        resourceCount: resources.length
    };
}

export function formatResourceLastOpened(value, now = new Date()) {
    const openedAt = resourceTimestamp(value);
    if (!openedAt) return "Not opened";

    const elapsedMinutes = Math.max(
        0,
        Math.floor((now.getTime() - openedAt) / 60_000)
    );
    if (elapsedMinutes < 1) return "Just now";
    if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;

    const elapsedHours = Math.floor(elapsedMinutes / 60);
    if (elapsedHours < 24) return `${elapsedHours}h ago`;

    const elapsedDays = Math.floor(elapsedHours / 24);
    return elapsedDays === 1 ? "Yesterday" : `${elapsedDays} days ago`;
}

export function filterAndSortResources(
    resources,
    { community = "all", query = "", sort = "newest", type = "all" } = {}
) {
    const search = query.trim().toLowerCase();
    const filtered = resources.filter((resource) => {
        const matchesQuery =
            !search ||
            [resource.title, resource.originalName]
                .join(" ")
                .toLowerCase()
                .includes(search);
        const matchesType =
            type === "all" || getResourceType(resource) === type;
        const matchesCommunity =
            community === "all" || resource.communityId === community;

        return matchesQuery && matchesType && matchesCommunity;
    });

    return [...filtered].sort((first, second) => {
        if (sort === "oldest") {
            return (
                resourceTimestamp(first.uploadedAt) -
                resourceTimestamp(second.uploadedAt)
            );
        }
        if (sort === "name") {
            return first.title.localeCompare(second.title, undefined, {
                sensitivity: "base"
            });
        }
        return (
            resourceTimestamp(second.uploadedAt) -
            resourceTimestamp(first.uploadedAt)
        );
    });
}
import { RECENT_RESOURCE_LIMIT } from "../../../config/resource-library.js";
