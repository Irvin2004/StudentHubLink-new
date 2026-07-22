import { escapeHtml } from "../utils/dom.js";
import { sanitizeUrl } from "../utils/validators.js";

const SEARCH_SECTIONS = Object.freeze([
    { key: "groups", title: "Groups" },
    { key: "assignments", title: "Assignments" },
    { key: "resources", title: "Resources" },
    { key: "users", title: "Users" }
]);

function requireContainer(container) {
    if (!container || !("innerHTML" in container)) {
        throw new Error("Search results container is required.");
    }

    return container;
}

function renderSearchItem(result = {}) {
    const title = String(result.title || "Search result").trim();
    const subtitle = String(result.subtitle || "").trim();
    const accessibleLabel = subtitle
        ? `${title} — ${subtitle}`
        : title;

    return `
        <a
            class="search-result"
            href="${escapeHtml(sanitizeUrl(result.url))}"
            data-search-result-id="${escapeHtml(result.id || "")}"
            data-search-result-type="${escapeHtml(result.type || "")}"
            aria-label="${escapeHtml(accessibleLabel)}"
        >
            <span class="search-icon" aria-hidden="true">
                ${escapeHtml(result.icon || "🔎")}
            </span>
            <span class="search-content">
                <strong class="search-result-title">
                    ${escapeHtml(title)}
                </strong>
                ${subtitle ? `
                    <span class="search-result-subtitle">
                        ${escapeHtml(subtitle)}
                    </span>
                ` : ""}
            </span>
        </a>
    `;
}

function renderSearchSection({ title, results }) {
    return `
        <section class="search-section" aria-label="${escapeHtml(title)}">
            <h3 class="search-section-title">${escapeHtml(title)}</h3>
            <div class="search-section-results">
                ${results.map(renderSearchItem).join("")}
            </div>
        </section>
    `;
}

function renderSearchEmpty() {
    return `
        <div class="search-state search-empty-state" role="status">
            <span class="search-state-icon" aria-hidden="true">🔍</span>
            <strong>No results found.</strong>
            <p>Try another search.</p>
        </div>
    `;
}

export function renderSearchResults(results = {}, container) {
    const target = requireContainer(container);
    const sections = SEARCH_SECTIONS.map(({ key, title }) => ({
        title,
        results: Array.isArray(results?.[key]) ? results[key] : []
    })).filter((section) => section.results.length > 0);
    const html = sections.length
        ? sections.map(renderSearchSection).join("")
        : renderSearchEmpty();

    target.removeAttribute?.("aria-busy");
    target.innerHTML = html;
    return html;
}

export function renderSearchLoading(container) {
    const target = requireContainer(container);
    const html = `
        <div class="search-state search-loading-state" role="status">
            <span class="search-spinner" aria-hidden="true"></span>
            <span>Searching...</span>
        </div>
    `;

    target.setAttribute?.("aria-busy", "true");
    target.innerHTML = html;
    return html;
}

export function renderSearchError(container) {
    const target = requireContainer(container);
    const html = `
        <div class="search-state search-error-state" role="alert">
            <span class="search-state-icon" aria-hidden="true">⚠️</span>
            <strong>Something went wrong while searching.</strong>
            <p>Please try again.</p>
        </div>
    `;

    target.removeAttribute?.("aria-busy");
    target.innerHTML = html;
    return html;
}
