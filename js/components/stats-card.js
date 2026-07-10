import { escapeHtml } from "../utils/dom.js";

export function createStatsCard(title, value, icon) {
    return `
        <article class="stats-card stat-box">
            <div class="stats-icon">
                ${escapeHtml(icon)}
            </div>

            <h3>${escapeHtml(value)}</h3>

            <p>${escapeHtml(title)}</p>
        </article>
    `;
}
