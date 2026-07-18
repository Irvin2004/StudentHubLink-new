import { escapeHtml } from "../utils/dom.js";
import { formatTime } from "../utils/formatDate.js?messaging=13";
import { sanitizeUrl } from "../utils/validators.js";
import { createFileCard } from "./file-card.js";
import { createImagePreview } from "./image-preview.js";

function createMessageContent(message) {
    if (message.deletedAt) {
        return '<p class="deleted-message">Message deleted</p>';
    }

    const caption = message.text
        ? `<p>${escapeHtml(message.text)}</p>`
        : "";

    if (message.type === "image") {
        return `${createImagePreview(message)}${caption}`;
    }

    if (message.type === "file") {
        return `${createFileCard(message)}${caption}`;
    }

    if (message.type === "voice") {
        return `
            <audio
                class="voice-message"
                controls
                preload="metadata"
                src="${escapeHtml(sanitizeUrl(message.fileUrl))}"
            ></audio>
        `;
    }

    return `<p>${escapeHtml(message.text || "")}</p>`;
}

function getStatusIcon(message) {
    if (message.status === "sending") {
        return `
            <span class="sending" aria-label="Sending">
                &#128339; Sending...
            </span>
        `;
    }

    if (message.readAt) {
        return `
            <span class="read" aria-label="Read">
                &#10003;&#10003;
            </span>
        `;
    }

    if (message.deliveredAt) {
        return `
            <span class="delivered" aria-label="Delivered">
                &#10003;&#10003;
            </span>
        `;
    }

    return `
        <span class="sent" aria-label="Sent">
            &#10003;
        </span>
    `;
}

export function createMessageBubble(
    message,
    currentUserId
) {
    const mine =
    message.senderId === currentUserId;

    return `
        <div class="message-row ${
            mine ? "mine" : "theirs"
        }">
            <div class="message-bubble">
                ${createMessageContent(message)}

                <div class="message-footer">
                    <span>
                        ${escapeHtml(formatTime(message.createdAt))}
                    </span>

                    ${message.editedAt ? '<span class="edited-label">Edited</span>' : ""}

                    ${mine ? getStatusIcon(message) : ""}
                </div>
            </div>
        </div>
    `;
}
