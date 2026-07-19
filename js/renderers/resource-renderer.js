import { createResourceCard } from "../components/resource-card.js";

export function renderResources(resources, container) {
    if (!container) return;

    if (!resources.length) {
        container.innerHTML = `
            <div class="group-resource-empty">
                <span aria-hidden="true">&#128218;</span>
                <h2>No resources found</h2>
                <p>Try changing your search or category filter.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = resources
        .map((resource) => createResourceCard(
            resource,
            { variant: "group-library" }
        ))
        .join("");
}