import { NOTIFICATION_TYPES } from "../config/notification-types.js";
import { getConversationById } from "../services/conversation-service.js";
import { getStudyGroupMembers } from "../services/group-service.js";
import { createNotification } from "../services/notification-service.js";
import { error as logError } from "../utils/logger.js";

function cleanId(value) {
    return typeof value === "string"
        ? value.trim()
        : "";
}

function uniqueRecipients(recipientIds, senderId) {
    const cleanSenderId = cleanId(senderId);

    return Array.from(new Set(
        recipientIds
            .map(cleanId)
            .filter((recipientId) => (
                recipientId && recipientId !== cleanSenderId
            ))
    ));
}

async function getGroupRecipients(groupId, senderId) {
    const members = await getStudyGroupMembers(groupId);

    return uniqueRecipients(
        members.map((member) => member.userId || member.id),
        senderId
    );
}

async function getPrivateRecipients(chatId, senderId) {
    const conversation = await getConversationById(chatId);

    return uniqueRecipients(
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
        const cleanChatId = cleanId(chatId);
        const cleanSenderId = cleanId(senderId);
        const isGroupChat = chatType === "group";
        const cleanGroupId = isGroupChat
            ? cleanId(message?.groupId)
            : "";
        const recipients = isGroupChat
            ? await getGroupRecipients(cleanGroupId, cleanSenderId)
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
