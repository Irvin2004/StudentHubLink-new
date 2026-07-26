import { formatDate } from "../utils/format-date.js";
import { escapeHtml } from "../utils/dom.js";

function getConversationPreview(conversation) {
    if (conversation.lastMessageType === "image") {
        return "\u{1F4F7} Photo";
    }

    if (conversation.lastMessageType === "file") {
        return `\u{1F4C4} ${conversation.lastMessage || "File"}`;
    }

    if (conversation.lastMessageType === "voice") {
        return "\u{1F3A4} Voice message";
    }

    return conversation.lastMessage || "Start a conversation";
}

export function createConversationItem(
    conversation,
    currentUserId,
    otherUser = {},
    preference = {}
) {
    const name =
        otherUser?.fullName ||
        otherUser?.name ||
        otherUser?.displayName ||
        "Student";
    const initial = otherUser?.isGroup
        ? "\u{1F4DA}"
        : name.charAt(0).toUpperCase();
    const unreadCount = conversation.unreadCounts?.[currentUserId] || 0;
    const lastMessage = getConversationPreview(conversation);

    return `
        <article
            class="conversation-entry${preference.pinned ? " pinned" : ""}${preference.muted ? " muted" : ""}${preference.archived ? " archived" : ""}"
            data-conversation-entry
            data-conversation-id="${escapeHtml(conversation.id)}"
            data-conversation-name="${escapeHtml(name.toLowerCase())}"
            data-conversation-label="${escapeHtml(name)}"
            data-conversation-type="${escapeHtml(conversation.type || "direct")}"
            data-group-id="${escapeHtml(conversation.groupId || "")}"
            data-other-user-id="${escapeHtml(otherUser?.id || "")}"
        >
            <a
                class="conversation-item"
                href="chat.html?id=${encodeURIComponent(conversation.id)}"
            >
                <div class="conversation-avatar" aria-hidden="true">
                    ${escapeHtml(initial)}
                    ${
                        !otherUser?.isGroup && otherUser?.online
                            ? '<span class="online-dot"></span>'
                            : ""
                    }
                </div>

                <div class="conversation-content">
                    <div class="conversation-top">
                        <h3>
                            ${
                                preference.pinned
                                    ? `
                                <span
                                    class="conversation-pin"
                                    aria-label="Pinned conversation"
                                    title="Pinned"
                                >&#128204;</span>
                            `
                                    : ""
                            }
                            ${
                                preference.muted
                                    ? `
                                <span
                                    class="conversation-muted"
                                    aria-label="Conversation muted"
                                    title="Conversation muted"
                                >&#128263;</span>
                            `
                                    : ""
                            }
                            ${
                                preference.archived
                                    ? `
                                <span
                                    class="conversation-archived"
                                    aria-label="Archived conversation"
                                    title="Archived"
                                >&#128230;</span>
                            `
                                    : ""
                            }
                            ${escapeHtml(name)}
                        </h3>
                        <small>
                            ${escapeHtml(
                                formatDate(conversation.lastMessageAt, {
                                    fallback: ""
                                })
                            )}
                        </small>
                    </div>

                    <div class="conversation-bottom">
                        <p>${escapeHtml(lastMessage)}</p>
                        ${
                            unreadCount > 0
                                ? `
                                    <span
                                        class="unread-badge"
                                        aria-label="${unreadCount} unread messages"
                                    >
                                        ${unreadCount}
                                    </span>
                                `
                                : ""
                        }
                    </div>
                </div>
            </a>
            <button
                class="conversation-menu-trigger"
                type="button"
                data-conversation-menu-trigger
                aria-label="Actions for ${escapeHtml(name)}"
                aria-haspopup="menu"
                aria-expanded="false"
            >&#8942;</button>
        </article>
    `;
}
