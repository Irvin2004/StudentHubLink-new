import { escapeHtml } from "../utils/dom.js";

export function createEmptyState(title, message, icon = "&#128236;") {
    return `
        <div class="empty-state">
            <div class="empty-icon">
                ${icon}
            </div>

            <h2>${escapeHtml(title)}</h2>

            <p>${escapeHtml(message)}</p>
        </div>
    `;
}
