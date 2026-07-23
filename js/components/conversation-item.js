import { formatDate } from "../utils/format-date.js";
import { escapeHtml } from "../utils/dom.js";
import {
    createConversationMenu
} from "./conversation-menu.js?preferences=1";

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
            class="conversation-entry${preference.pinned ? " pinned" : ""}"
            data-conversation-entry
            data-conversation-id="${escapeHtml(conversation.id)}"
            data-conversation-name="${escapeHtml(name.toLowerCase())}"
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
                            ${preference.pinned ? `
                                <span
                                    class="conversation-pin"
                                    aria-label="Pinned conversation"
                                    title="Pinned"
                                >&#128204;</span>
                            ` : ""}
                            ${escapeHtml(name)}
                        </h3>
                        <small>
                            ${escapeHtml(formatDate(
                                conversation.lastMessageAt,
                                { fallback: "" }
                            ))}
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
            ${createConversationMenu({
                conversationId: conversation.id,
                preference
            })}
        </article>
    `;
}
