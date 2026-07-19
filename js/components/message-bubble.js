import { escapeHtml } from "../utils/dom.js";
import { formatTime } from "../utils/formatDate.js?messaging=13";
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
        return `
            <audio
                class="voice-message"
                controls
                preload="metadata"
                src="${escapeHtml(sanitizeUrl(message.fileUrl))}"
            ></audio>
        `;
    }

    return `
        <p class="message-text">
            ${escapeHtml(message.text || "")}
        </p>
    `;
}

function getStatusIcon(message, options = {}) {
    if (message.status === "sending") {
        return `
            <span class="sending" aria-label="Sending">
                &#128339; Sending...
            </span>
        `;
    }

    if (options.conversationType === "group") {
        const readers = new Set(message.readBy || []);
        readers.delete(message.senderId);
        const seenCount = readers.size;

        if (
            options.memberCount > 0 &&
            seenCount >= options.memberCount - 1
        ) {
            return `
                <span class="read group-read" aria-label="Seen by everyone">
                    Seen by everyone
                </span>
            `;
        }

        return `
            <span class="delivered group-read" aria-label="Seen by ${seenCount}">
                ${seenCount > 0 ? `Seen by ${seenCount}` : "Sent"}
            </span>
        `;
    }

    if (message.readAt) {
        return `<span class="read" aria-label="Read">&#10003;&#10003;</span>`;
    }

    if (message.deliveredAt) {
        return `<span class="delivered" aria-label="Delivered">&#10003;&#10003;</span>`;
    }

    return `<span class="sent" aria-label="Sent">&#10003;</span>`;
}

function renderReactions(message, currentUserId) {
    if (message.deleted || message.deletedAt || !message.reactions) return "";

    const reactions = Object.entries(message.reactions)
        .filter(([, users]) => Array.isArray(users) && users.length > 0);

    if (!reactions.length) return "";

    return `
        <div class="message-reactions">
            ${reactions.map(([emoji, users]) => {
                const reacted = users.includes(currentUserId);
                return `
                    <button
                        class="reaction-chip${reacted ? " reacted" : ""}"
                        type="button"
                        data-emoji="${escapeHtml(emoji)}"
                        aria-label="${escapeHtml(emoji)} reaction, ${users.length}"
                        aria-pressed="${reacted}">
                        ${escapeHtml(emoji)}
                        <span>${users.length}</span>
                    </button>
                `;
            }).join("")}
        </div>
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
                ${renderReactions(message, currentUserId)}

                <div class="message-footer">
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

                    ${mine ? getStatusIcon(message, options) : ""}
                </div>
            </div>
        </div>
    `;
}