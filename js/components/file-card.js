import { escapeHtml } from "../utils/dom.js";
import { formatFileSize } from "../utils/format-file-size.js";
import { sanitizeUrl } from "../utils/validators.js";

export function createFileCard(file = {}) {
    return `
        <a
            class="file-card chat-file"
            href="${escapeHtml(sanitizeUrl(file.fileUrl))}"
            target="_blank"
            rel="noopener noreferrer"
        >
            <span class="file-card-icon file-icon" aria-hidden="true">&#128196;</span>
            <span class="file-card-content file-info">
                <strong>${escapeHtml(file.fileName || "Attachment")}</strong>
                <small>${escapeHtml(formatFileSize(file.fileSize))}</small>
            </span>
        </a>
    `;
}
