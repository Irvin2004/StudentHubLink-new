import { escapeHtml } from "../utils/dom.js";

const SIZES = new Set(["sm", "md", "lg", "xl"]);

export function createAvatar({ name = "Student", imageUrl = "", size = "md", online = false } = {}) {
    const safeSize = SIZES.has(size) ? size : "md";
    const initial = name.trim().charAt(0).toUpperCase() || "S";
    const image = imageUrl
        ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(name)}">`
        : `<span aria-hidden="true">${escapeHtml(initial)}</span>`;

    return `<span class="avatar avatar-${safeSize}" aria-label="${escapeHtml(name)}${online ? ", online" : ""}">${image}${online ? '<span class="avatar-status" aria-hidden="true"></span>' : ""}</span>`;
}
