import { escapeHtml } from "../utils/dom.js";
import { sanitizeUrl } from "../utils/validators.js";

export function createImagePreview(image = {}) {
    const imageUrl = sanitizeUrl(image.fileUrl);

    return `
        <a
            class="image-preview"
            href="${escapeHtml(imageUrl)}"
            target="_blank"
            rel="noopener noreferrer"
        >
            <img
                src="${escapeHtml(imageUrl)}"
                alt="${escapeHtml(image.fileName || "Shared image")}" 
                loading="lazy"
            >
        </a>
    `;
}
