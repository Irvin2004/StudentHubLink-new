import { escapeHtml } from "../utils/dom.js";

function createIcon(name) {
    const paths = {
        book: `
            <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z"/>
            <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z"/>
        `,
        users: `
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        `,
        globe: `
            <circle cx="12" cy="12" r="9"/>
            <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>
        `,
        lock: `
            <rect x="4" y="10" width="16" height="11" rx="2"/>
            <path d="M8 10V7a4 4 0 0 1 8 0v3"/>
        `
    };

    return `
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round">
            ${paths[name] || paths.book}
        </svg>
    `;
}

function renderTags(tags = []) {
    if (!tags.length) {
        return "";
    }

    return `
        <div class="group-tags">
            ${tags.map((tag) => `
                <span>#${escapeHtml(tag)}</span>
            `).join("")}
        </div>
    `;
}

export function createGroupCard(
    group,
    {
        joined = false,
        owner = false
    } = {}
) {
    const isPrivate =
        group.visibility === "private";

    const moduleLabel =
        [group.moduleName, group.moduleCode]
            .filter(Boolean)
            .join(" · ");

    const buttonLabel =
        owner
            ? "Owner"
            : joined
                ? "Joined"
                : isPrivate
                    ? "Private group"
                    : "Join group";

    return `
        <article
            class="group-card"
            data-group-id="${escapeHtml(group.id)}">
            <div class="group-card-heading">
                <span class="group-card-icon">
                    ${createIcon(isPrivate ? "lock" : "book")}
                </span>

                <div>
                    <h2>${escapeHtml(group.name)}</h2>
                    <p class="group-module">
                        ${escapeHtml(moduleLabel)}
                    </p>
                </div>
            </div>

            <p class="group-description">
                ${escapeHtml(
                    group.description ||
                    "A study community for students learning together."
                )}
            </p>

            ${renderTags(group.tags)}

            <div class="group-meta">
                <span>
                    ${createIcon("users")}
                    ${Number(group.memberCount || 0)} members
                </span>

                <span>
                    ${createIcon(isPrivate ? "lock" : "globe")}
                    ${isPrivate ? "Private" : "Public"}
                </span>
            </div>

            <div class="group-card-actions">
                <a
                    class="btn btn-secondary"
                    href="group-details.html?id=${encodeURIComponent(group.id)}">
                    View details
                </a>

                <button
                    class="btn ${
                        owner
                            ? "group-owner-button"
                            : joined
                                ? "group-joined-button"
                                : "btn-primary"
                    }"
                    type="button"
                    data-action="toggle-group-membership"
                    data-group-id="${escapeHtml(group.id)}"
                    ${owner || (!joined && isPrivate) ? "disabled" : ""}>
                    ${joined && !owner ? "✓ " : ""}${buttonLabel}
                </button>
            </div>
        </article>
    `;
}