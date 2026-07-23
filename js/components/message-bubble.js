import { escapeHtml } from "../utils/dom.js";
import { formatTime } from "../utils/format-date.js?messaging=13";
import { sanitizeUrl } from "../utils/validators.js";
import { createFileCard } from "./file-card.js";
import { createImagePreview } from "./image-preview.js";

function renderMessageContent(message) {
    if (message.deleted || message.deletedAt) {
        return `
            <p class="deleted-message">
                This message was deleted.
            </p>
        `;
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
        const voiceUrl = message.voice?.url || message.fileUrl;

        return `
            <audio
                class="voice-message"
                controls
                preload="metadata"
                src="${escapeHtml(sanitizeUrl(voiceUrl))}"
            ></audio>
        `;
    }

    return `
        <p class="message-text">
            ${escapeHtml(message.text || "")}
        </p>
    `;
}

export function createMessageBubble(message, currentUserId, options = {}) {
    const mine = message.senderId === currentUserId;
    const deleted = message.deleted || Boolean(message.deletedAt);

    return `
        <div class="message-row ${mine ? "mine" : "theirs"}"
            data-message-id="${escapeHtml(message.id)}">
            <div class="message-bubble">
                ${options.conversationType === "group" && !mine ? `
                    <div class="message-sender">
                        ${escapeHtml(message.senderName || "Student")}
                    </div>
                ` : ""}

                ${!deleted && message.replyTo ? `
                    <div class="reply-block">
                        <strong>${escapeHtml(message.replyTo.senderName || "Student")}</strong>
                        <p>${escapeHtml(message.replyTo.preview || "Message")}</p>
                    </div>
                ` : ""}

                ${renderMessageContent(message)}

                <div class="message-footer">
                    ${!deleted ? `<button
                        class="message-reaction-button"
                        type="button"
                        data-message-action="react"
                        data-message-id="${escapeHtml(message.id)}"
                        aria-label="React to message">
                        &#128512; React
                    </button>` : ""}

                    ${!deleted ? `<button
                        class="message-reply-button"
                        type="button"
                        data-message-action="reply"
                        data-message-id="${escapeHtml(message.id)}"
                        aria-label="Reply to message">
                        &#8617; Reply
                    </button>` : ""}

                    <span class="message-time">
                        ${escapeHtml(formatTime(message.createdAt))}
                        ${!deleted && (message.edited || message.editedAt)
                            ? '<span class="edited-label">&bull; edited</span>'
                            : ""}
                    </span>

                    ${mine && message.status === "sending" ? `
                        <span class="sending" aria-label="Sending">
                            &#128339; Sending...
                        </span>
                    ` : ""}

                    ${mine && message.status !== "sending" ? `
                        <div
                            class="read-receipt-container"
                            data-read-receipt-container
                            data-message-id="${escapeHtml(message.id)}">
                        </div>
                    ` : ""}
                </div>
            </div>
        </div>
    `;
}
