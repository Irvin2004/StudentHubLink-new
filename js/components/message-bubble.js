import { escapeHtml } from "../utils/dom.js";
import { formatDate } from "../utils/formatDate.js";

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
                <p>
                    ${escapeHtml(message.text || "")}
                </p>

                <small>
                    ${escapeHtml(formatDate(message.createdAt))}
                </small>
            </div>
        </div>
    `;
}
