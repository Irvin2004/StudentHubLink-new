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
