import { escapeHtml } from "../utils/dom.js";

export function createFavoriteButton(resourceId, isFavorite = false) {
    const label = isFavorite ? "Remove from favorites" : "Add to favorites";

    return `
        <button
            class="favorite-btn ${isFavorite ? "active" : ""}"
            data-favorite-id="${escapeHtml(resourceId || "")}"
            aria-label="${label}"
            title="${label}"
            type="button"
        >
            ${isFavorite ? "&hearts;" : "&#9825;"}
        </button>
    `;
}
