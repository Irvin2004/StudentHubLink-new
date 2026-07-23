import { createResourceCard } from "../components/resource-card.js";
import {
    createEmptyState
} from "../components/empty-state.js?refinement=1";
import {
    hideSkeleton
} from "./skeleton-renderer.js";

export function renderResources(resources, container) {
    if (!container) return;

    if (container.querySelector?.("[data-skeleton-root]")) {
        hideSkeleton(container);
    }

    container.setAttribute?.("aria-busy", "false");

    if (!resources.length) {
        container.innerHTML = createEmptyState({
            icon: "&#128218;",
            title: "No resources found",
            message:
                "Upload the first resource or change your search and filters."
        });
        return;
    }

    container.innerHTML = resources
        .map((resource) => createResourceCard(
            resource,
            { variant: "group-library" }
        ))
        .join("");
}
