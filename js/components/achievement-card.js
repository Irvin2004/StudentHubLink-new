import { escapeHtml } from "../utils/dom.js";
import { formatDate } from "../utils/formatDate.js";

function getAchievementIcon(icon) {
    const icons = {
        download: "DL",
        upload: "UP",
        library: "LIB",
        achievement: "&#127942;",
        trophy: "&#127942;"
    };

    return icons[icon] || "&#127942;";
}

export function createAchievementCard(achievement) {
    return `
        <article class="achievement-card">
            <div class="achievement-icon">
                ${getAchievementIcon(achievement.icon)}
            </div>

            <h3>${escapeHtml(achievement.title || "Achievement")}</h3>

            <p>${escapeHtml(achievement.description || "")}</p>

            <small class="achievement-date">
                Earned ${escapeHtml(formatDate(achievement.earnedAt))}
            </small>
        </article>
    `;
}
