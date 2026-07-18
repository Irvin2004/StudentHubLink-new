import { escapeHtml } from "../utils/dom.js";

export function createLoader(label = "Loading", size = "md") {
    const safeSize = ["sm", "md", "lg"].includes(size) ? size : "md";
    return `<span class="loader loader-${safeSize}" role="status"><span class="sr-only">${escapeHtml(label)}</span></span>`;
}
