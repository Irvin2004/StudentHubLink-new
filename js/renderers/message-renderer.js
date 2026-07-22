import { createMessageBubble } from "../components/message-bubble.js?messaging=17";
import { renderReactionBar } from "./reaction-renderer.js?reactions=1";

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

    const visibleMessages = messages
        .filter((message) =>
            !message.deletedFor?.includes(currentUserId)
        );

    container.innerHTML =
    visibleMessages
        .map((message) =>
            createMessageBubble(
                message,
                currentUserId,
                options
            )
        )
        .join("");

    const messageRows = container.querySelectorAll(
        ".message-row[data-message-id]"
    );

    messageRows.forEach((messageRow, index) => {
        const message = visibleMessages[index];

        if (
            !message ||
            message.deleted ||
            message.deletedAt ||
            message.status === "sending"
        ) {
            return;
        }

        const reactionContainer = document.createElement("div");
        reactionContainer.dataset.messageId = message.id || "";
        reactionContainer.dataset.reactionContainer = "";

        renderReactionBar(
            Array.isArray(message.reactions) ? message.reactions : [],
            currentUserId,
            reactionContainer
        );

        messageRow
            .querySelector(".message-footer")
            ?.before(reactionContainer);
    });

    container.scrollTop =
    container.scrollHeight;
}
