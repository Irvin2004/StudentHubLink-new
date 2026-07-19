import { createMessageBubble } from "../components/message-bubble.js?messaging=16";

export function renderMessages(
    messages,
    currentUserId,
    options = {}
) {
    const container =
    document.getElementById("messageList");

    if (!container) {
        return;
    }

    container.innerHTML =
    messages
        .filter((message) =>
            !message.deletedFor?.includes(currentUserId)
        )
        .map((message) =>
            createMessageBubble(
                message,
                currentUserId,
                options
            )
        )
        .join("");

    container.scrollTop =
    container.scrollHeight;
}
