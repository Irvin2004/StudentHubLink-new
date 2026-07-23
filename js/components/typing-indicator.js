import { escapeHtml } from "../utils/dom.js";

export function createTypingIndicator(userName, isTyping = false) {
    const name = userName || "Student";

    return `
        <p
            class="typing-indicator"
            ${isTyping ? "" : "hidden"}
            aria-live="polite"
        >
            ${isTyping ? `${escapeHtml(name)} is typing...` : ""}
        </p>
    `;
}
export function getTypingIndicatorText(statuses = [], currentUserId) {
    const typingUsers = statuses.filter(
        (status) => status.userId !== currentUserId && status.typing === true
    );

    if (!typingUsers.length) return "";

    if (typingUsers.length > 2) {
        return `${typingUsers.length} people are typing...`;
    }

    const names = typingUsers.map((status) => status.displayName || "Student");

    return `${names.join(" and ")} ${
        names.length === 1 ? "is" : "are"
    } typing...`;
}
