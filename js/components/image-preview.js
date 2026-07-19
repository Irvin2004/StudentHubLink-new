import { escapeHtml } from "../utils/dom.js";
import { sanitizeUrl } from "../utils/validators.js";

export function createImagePreview(image = {}) {
    const imageUrl = sanitizeUrl(image.fileUrl);

    return `
        <button
            type="button"
            class="image-preview chat-image"
            aria-label="Open ${escapeHtml(image.fileName || "shared image")}">
            <img
                class="chat-image-preview"
                src="${escapeHtml(imageUrl)}"
                alt="${escapeHtml(image.fileName || "Shared image")}" 
                data-image="${escapeHtml(imageUrl)}"
                loading="lazy"
            >
        </button>
    `;
}
