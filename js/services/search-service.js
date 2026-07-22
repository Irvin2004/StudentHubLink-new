import {
    createSearchResult,
    SEARCH_RESULT_TYPES
} from "../models/search-result.js";
import { getUpcomingAssignments } from
    "./assignment-service.js?unified-search=1";
import { getUserGroups } from "./group-service.js?unified-search=1";
import { getResources } from "./resource-service.js?unified-search=1";
import { getUsers } from "./user-service.js?unified-search=1";

export function normalizeSearchQuery(query) {
    return String(query || "")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();
}

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

function matches(value, query) {
    return String(value || "")
        .toLowerCase()
        .includes(query);
}

function createEmptySearchResults() {
    return {
        groups: [],
        assignments: [],
        resources: [],
        users: []
    };
}

export async function searchEverything(userId, query) {
    const term = normalizeSearchQuery(query);

    if (term.length < 2) {
        return createEmptySearchResults();
    }

    const [groups, assignments, resources, users] = await Promise.all([
        getUserGroups(userId),
        getUpcomingAssignments(userId),
        getResources(userId),
        getUsers()
    ]);

    return {
        groups: groups
            .filter((group) =>
                matches(group.name, term) ||
                matches(group.description, term)
            )
            .map((group) => createSearchResult({
                id: group.id,
                type: SEARCH_RESULT_TYPES.GROUP,
                title: group.name,
                subtitle: group.description,
                url: `./group-details.html?id=${encodeURIComponent(group.id)}`,
                icon: "👥",
                metadata: { memberCount: group.memberCount || 0 }
            })),
        assignments: assignments
            .filter((assignment) =>
                matches(assignment.title, term) ||
                matches(assignment.description, term)
            )
            .map((assignment) => createSearchResult({
                id: assignment.id,
                type: SEARCH_RESULT_TYPES.ASSIGNMENT,
                title: assignment.title,
                subtitle: assignment.description,
                url: `./group-details.html?id=${encodeURIComponent(
                    assignment.groupId
                )}`,
                icon: "📝",
                metadata: {
                    groupId: assignment.groupId,
                    dueDate: assignment.dueDate || null
                }
            })),
        resources: resources
            .filter((resource) =>
                matches(resource.title, term) ||
                matches(resource.description, term) ||
                matches(resource.category, term) ||
                matches(resource.uploaderName, term)
            )
            .map((resource) => createSearchResult({
                id: resource.id,
                type: SEARCH_RESULT_TYPES.RESOURCE,
                title: resource.title,
                subtitle: resource.description || resource.category,
                url: `./group-resources.html?id=${encodeURIComponent(
                    resource.groupId
                )}`,
                icon: "📚",
                metadata: {
                    groupId: resource.groupId,
                    category: resource.category || ""
                }
            })),
        users: users
            .filter((user) =>
                matches(user.displayName, term) ||
                matches(user.username, term) ||
                matches(user.bio, term)
            )
            .map((user) => createSearchResult({
                id: user.id,
                type: SEARCH_RESULT_TYPES.USER,
                title: user.displayName || user.username || "Student",
                subtitle: user.bio || (
                    user.username ? `@${user.username}` : "Student"
                ),
                url: `./user-profile.html?id=${encodeURIComponent(user.id)}`,
                icon: "👤",
                metadata: { photoURL: user.photoURL || "" }
            }))
    };
}
