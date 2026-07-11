import { createMessageBubble } from "../components/message-bubble.js";

export function renderMessages(
    messages,
    currentUserId
) {
    const container =
    document.getElementById("messageList");

    if (!container) {
        return;
    }

    container.innerHTML =
    messages
        .map((message) =>
            createMessageBubble(
                message,
                currentUserId
            )
        )
        .join("");

    container.scrollTop =
    container.scrollHeight;
}
