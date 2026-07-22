import { createMessageBubble } from "../components/message-bubble.js?messaging=18";
import { renderReactionBar } from "./reaction-renderer.js?reactions=1";
import { renderReadReceipt } from "./read-receipt-renderer.js?receipts=1";

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

        const statusContainer = messageRow.querySelector(
            "[data-read-receipt-container]"
        );

        if (statusContainer) {
            renderReadReceipt(
                Array.isArray(message.readReceipts)
                    ? message.readReceipts
                    : [],
                currentUserId,
                {
                    ...message,
                    expectedRecipientCount:
                        options.conversationType === "group"
                            ? Math.max(Number(options.memberCount || 0) - 1, 1)
                            : 1
                },
                statusContainer
            );
        }
    });

    container.scrollTop =
    container.scrollHeight;
}
