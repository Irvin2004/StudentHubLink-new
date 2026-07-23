import { escapeHtml } from "../utils/dom.js";

export function createLeaderboardItem({ href = "", label, meta, rank }) {
    const prefix = Number.isFinite(rank) ? `${rank}. ` : "";

    const labelMarkup = href
        ? `<a href="${escapeHtml(href)}">${escapeHtml(prefix + label)}</a>`
        : `<strong>${escapeHtml(prefix + label)}</strong>`;

    return `
        <div class="leaderboard-item">
            ${labelMarkup}
            <span>${escapeHtml(meta)}</span>
        </div>
    `;
}
