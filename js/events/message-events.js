import { NOTIFICATION_TYPES } from "../config/notification-types.js";
import { getConversationById } from "../services/conversation-service.js";
import { createNotification } from "../services/notification-service.js";
import { error as logError } from "../utils/logger.js";
import {
    cleanEventId,
    getGroupEventRecipients,
    uniqueEventRecipients
} from "./recipient-utils.js";

async function getPrivateRecipients(chatId, senderId) {
    const conversation = await getConversationById(chatId);

    return uniqueEventRecipients(
        conversation.participantIds || [],
        senderId
    );
}

function shouldNotifyRecipient() {
    // Conversation-presence checks can be added here without changing
    // the message service or the event's public API.
    return true;
}

export async function emitMessageSent({
    message,
    chatId,
    senderId,
    chatType
} = {}) {
    try {
        const cleanChatId = cleanEventId(chatId);
        const cleanSenderId = cleanEventId(senderId);
        const isGroupChat = chatType === "group";
        const cleanGroupId = isGroupChat
            ? cleanEventId(message?.groupId)
            : "";
        const recipients = isGroupChat
            ? await getGroupEventRecipients(cleanGroupId, cleanSenderId)
            : await getPrivateRecipients(cleanChatId, cleanSenderId);
        const eligibleRecipients = recipients.filter((recipientId) =>
            shouldNotifyRecipient({
                recipientId,
                chatId: cleanChatId
            })
        );
        const senderName = message?.senderName?.trim() || "Someone";
        const deliveries = await Promise.all(
            eligibleRecipients.map(async (recipientId) => {
                try {
                    await createNotification({
                        type: NOTIFICATION_TYPES.NEW_MESSAGE,
                        recipientId,
                        senderId: cleanSenderId,
                        groupId: cleanGroupId || null,
                        conversationId: cleanChatId,
                        referenceId: message?.id,
                        title: "New Message",
                        message: `${senderName} sent a new message.`
                    });

                    return true;
                } catch (error) {
                    logError(
                        "NOTIFICATIONS",
                        `Message notification failed for ${recipientId}:`,
                        error
                    );
                    return false;
                }
            })
        );

        return {
            recipients: eligibleRecipients.length,
            delivered: deliveries.filter(Boolean).length,
            failed: deliveries.filter((delivered) => !delivered).length
        };
    } catch (error) {
        logError(
            "NOTIFICATIONS",
            "Message notification event failed:",
            error
        );

        return {
            recipients: 0,
            delivered: 0,
            failed: 0
        };
    }
}
