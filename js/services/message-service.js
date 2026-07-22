import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    increment,
    limitToLast,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    arrayUnion,
    updateDoc,
    where,
    writeBatch
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import { db } from "../firebase.js";
import { COLLECTIONS } from "../config/firestore.js";
import { MESSAGE_TYPES } from "../utils/constants.js?messaging=13";
import { createReactionModel } from "../models/reaction.js";
import { emitMessageSent } from "../events/message-events.js";
import { error as logError } from "../utils/logger.js";

export { MESSAGE_TYPES };

export function createMessageId() {
    return doc(collection(db, COLLECTIONS.MESSAGES)).id;
}

function normalizeMessage(messageId, data = {}) {
    return {
        id: messageId,
        conversationId: data.conversationId || "",
        senderId: data.senderId || "",
        receiverId: data.receiverId || null,
        groupId: data.groupId || null,
        senderName: data.senderName || "Student",
        type: data.type || MESSAGE_TYPES.TEXT,
        text: data.text || "",
        fileUrl: data.fileUrl || null,
        fileName: data.fileName || null,
        mimeType: data.mimeType || null,
        fileSize: data.fileSize ?? null,
        createdAt: data.createdAt || null,
        edited: data.edited === true,
        editedAt: data.editedAt || null,
        deleted: data.deleted === true || Boolean(data.deletedAt),
        deletedFor: Array.isArray(data.deletedFor)
            ? data.deletedFor
            : [],
        deletedAt: data.deletedAt || null,
        deliveredAt: data.deliveredAt || null,
        readAt: data.readAt || null,
        readBy: Array.isArray(data.readBy) ? data.readBy : [],
        reactions: data.reactions || {},
        replyTo: data.replyTo || null
    };
}

function createMessageDocument({
    conversationId,
    senderId,
    receiverId = null,
    groupId = null,
    senderName = "Student",
    type = MESSAGE_TYPES.TEXT,
    text = "",
    fileUrl = null,
    fileName = null,
    mimeType = null,
    fileSize = null,
    replyTo = null
}) {
    return {
        conversationId,
        senderId,
        receiverId,
        groupId,
        senderName: senderName?.trim() || "Student",
        type,
        text: text.trim(),
        fileUrl,
        fileName,
        mimeType,
        fileSize,
        createdAt: serverTimestamp(),
        edited: false,
        editedAt: null,
        deleted: false,
        deletedFor: [],
        deletedAt: null,
        deliveredAt: null,
        readAt: null,
        readBy: groupId ? [senderId] : [],
        reactions: {},
        replyTo
    };
}

function getConversationPreview(message) {
    if (message.type === MESSAGE_TYPES.IMAGE) {
        return "Photo";
    }

    if (message.type === MESSAGE_TYPES.FILE) {
        return message.fileName || "File";
    }

    if (message.type === MESSAGE_TYPES.VOICE) {
        return "Voice message";
    }

    return message.text;
}

function validateId(value, fieldName) {
    const cleanValue = typeof value === "string" ? value.trim() : "";

    if (!cleanValue) {
        throw new Error(`${fieldName} is required.`);
    }

    return cleanValue;
}

function getReactionsCollection(conversationId, messageId) {
    return collection(
        db,
        COLLECTIONS.CONVERSATIONS,
        conversationId,
        COLLECTIONS.MESSAGES,
        messageId,
        "reactions"
    );
}

function getReactionReference(conversationId, messageId, userId) {
    return doc(
        getReactionsCollection(conversationId, messageId),
        userId
    );
}

function normalizeReaction(reactionDocument) {
    return {
        userId: reactionDocument.id,
        reaction: reactionDocument.data().reaction
    };
}

export async function sendMessage(input) {
    const {
        conversationId,
        senderId,
        receiverId,
        messageId = createMessageId()
    } = input;

    const requestedConversationType = input.conversationType ||
        (input.type === "group" || input.type === "direct"
            ? input.type
            : (input.groupId ? "group" : "direct"));
    const isGroupMessage = requestedConversationType === "group";
    const messageInput = input.type === "group" || input.type === "direct"
        ? { ...input, type: MESSAGE_TYPES.TEXT }
        : input;

    if (!conversationId || !senderId) {
        throw new Error("Message information is incomplete.");
    }

    if (isGroupMessage && (!input.groupId || input.receiverId)) {
        throw new Error("Group message information is incomplete.");
    }

    if (!isGroupMessage && (!input.receiverId || input.groupId)) {
        throw new Error("Direct message information is incomplete.");
    }

    const message = createMessageDocument(messageInput);

    if (message.type === MESSAGE_TYPES.TEXT && !message.text) {
        throw new Error("Message cannot be empty.");
    }

    if (message.type !== MESSAGE_TYPES.TEXT && !message.fileUrl) {
        throw new Error("Message attachment is missing.");
    }

    const batch = writeBatch(db);
    const messageRef = doc(db, COLLECTIONS.MESSAGES, messageId);
    const conversationRef = doc(
        db,
        COLLECTIONS.CONVERSATIONS,
        conversationId
    );

    batch.set(messageRef, message);

    const conversationUpdate = {
        lastMessage: getConversationPreview(message),
        lastMessageType: message.type,
        lastMessageSenderId: senderId,
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };

    if (!isGroupMessage) {
        conversationUpdate[`unreadCounts.${receiverId}`] = increment(1);
    }

    batch.update(conversationRef, conversationUpdate);

    await batch.commit();

    try {
        await emitMessageSent({
            message: {
                id: messageId,
                ...message
            },
            chatId: conversationId,
            senderId,
            chatType: isGroupMessage ? "group" : "direct"
        });
    } catch (error) {
        logError(
            "NOTIFICATIONS",
            "Message notification event failed:",
            error
        );
    }

    return messageId;
}

export async function editMessage({
    conversationId,
    messageId,
    newText
}) {
    const cleanText = newText?.trim();

    if (!conversationId || !messageId) {
        throw new Error("Message information is incomplete.");
    }

    if (!cleanText) {
        throw new Error("Message cannot be empty.");
    }

    if (cleanText.length > 1000) {
        throw new Error("Message cannot exceed 1000 characters.");
    }

    await updateDoc(
        doc(db, COLLECTIONS.MESSAGES, messageId),
        {
            text: cleanText,
            edited: true,
            editedAt: serverTimestamp()
        }
    );
}

export async function deleteMessageForEveryone({
    conversationId,
    messageId
}) {
    if (!conversationId || !messageId) {
        throw new Error("Message information is incomplete.");
    }

    await updateDoc(
        doc(db, COLLECTIONS.MESSAGES, messageId),
        {
            text: "This message was deleted.",
            deleted: true,
            deletedAt: serverTimestamp(),
            fileUrl: null,
            fileName: null,
            fileSize: null,
            mimeType: null
        }
    );
}

export async function deleteMessageForMe({
    conversationId,
    messageId,
    userId
}) {
    if (!conversationId || !messageId || !userId) {
        throw new Error("Message information is incomplete.");
    }

    await updateDoc(
        doc(db, COLLECTIONS.MESSAGES, messageId),
        {
            deletedFor: arrayUnion(userId)
        }
    );
}

export function subscribeToMessages(
    conversationId,
    callback,
    onError
) {
    const messagesQuery = query(
        collection(db, COLLECTIONS.MESSAGES),
        where("conversationId", "==", conversationId),
        orderBy("createdAt", "asc"),
        limitToLast(200)
    );

    return onSnapshot(
        messagesQuery,
        (snapshot) => {
            callback(snapshot.docs.map((messageDocument) =>
                normalizeMessage(
                    messageDocument.id,
                    messageDocument.data()
                )
            ));
        },
        (error) => {
            console.error("Message listener failed:", error);

            if (typeof onError === "function") {
                onError(error);
            }
        }
    );
}

export async function markMessagesAsDelivered(
    messages,
    currentUserId
) {
    const undeliveredMessages = messages.filter((message) =>
        message.receiverId === currentUserId &&
        !message.deliveredAt
    );

    await Promise.all(
        undeliveredMessages.map((message) =>
            updateDoc(
                doc(db, COLLECTIONS.MESSAGES, message.id),
                { deliveredAt: serverTimestamp() }
            )
        )
    );
}

export async function markConversationMessagesAsRead(
    conversationId,
    currentUserId,
    conversationType = "direct"
) {
    if (conversationType === "group") {
        const groupQuery = query(
            collection(db, COLLECTIONS.MESSAGES),
            where("conversationId", "==", conversationId)
        );
        const snapshot = await getDocs(groupQuery);
        const unreadMessages = snapshot.docs.filter((messageDocument) => {
            const message = messageDocument.data();
            return message.senderId !== currentUserId
                && !(message.readBy || []).includes(currentUserId);
        });

        if (!unreadMessages.length) return;

        const batch = writeBatch(db);
        unreadMessages.forEach((messageDocument) => {
            batch.update(messageDocument.ref, {
                readBy: arrayUnion(currentUserId)
            });
        });
        await batch.commit();
        return;
    }

    const unreadQuery = query(
        collection(db, COLLECTIONS.MESSAGES),
        where("conversationId", "==", conversationId),
        where("receiverId", "==", currentUserId),
        where("readAt", "==", null)
    );
    const snapshot = await getDocs(unreadQuery);

    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.forEach((messageDocument) => {
        batch.update(messageDocument.ref, { readAt: serverTimestamp() });
    });
    batch.update(doc(db, COLLECTIONS.CONVERSATIONS, conversationId), {
        [`unreadCounts.${currentUserId}`]: 0,
        updatedAt: serverTimestamp()
    });
    await batch.commit();
}
export async function addReaction(
    conversationId,
    messageId,
    userId,
    reaction
) {
    const cleanConversationId = validateId(
        conversationId,
        "Conversation ID"
    );
    const model = createReactionModel({
        messageId,
        userId,
        reaction
    });

    await setDoc(
        getReactionReference(
            cleanConversationId,
            model.messageId,
            model.userId
        ),
        {
            reaction: model.reaction,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        }
    );

    return model;
}

export async function removeReaction(
    conversationId,
    messageId,
    userId
) {
    const cleanConversationId = validateId(
        conversationId,
        "Conversation ID"
    );
    const cleanMessageId = validateId(messageId, "Message ID");
    const cleanUserId = validateId(userId, "User ID");

    await deleteDoc(getReactionReference(
        cleanConversationId,
        cleanMessageId,
        cleanUserId
    ));
}

export async function getMessageReactions(conversationId, messageId) {
    const cleanConversationId = validateId(
        conversationId,
        "Conversation ID"
    );
    const cleanMessageId = validateId(messageId, "Message ID");
    const snapshot = await getDocs(
        getReactionsCollection(cleanConversationId, cleanMessageId)
    );

    return snapshot.docs.map(normalizeReaction);
}

export function subscribeToReactions(
    conversationId,
    messageId,
    callback,
    onError
) {
    const cleanConversationId = validateId(
        conversationId,
        "Conversation ID"
    );
    const cleanMessageId = validateId(messageId, "Message ID");

    if (typeof callback !== "function") {
        throw new Error("Reaction subscriber is required.");
    }

    return onSnapshot(
        getReactionsCollection(cleanConversationId, cleanMessageId),
        (snapshot) => callback(snapshot.docs.map(normalizeReaction)),
        (error) => {
            if (typeof onError === "function") {
                onError(error);
                return;
            }

            console.error("Reaction listener failed:", error);
        }
    );
}

/* Compatibility adapter for the current chat controller. */
export async function reactToMessage({
    conversationId,
    messageId,
    emoji,
    userId
}) {
    const cleanConversationId = validateId(
        conversationId,
        "Conversation ID"
    );
    const model = createReactionModel({
        messageId,
        userId,
        reaction: emoji
    });
    const reactionReference = getReactionReference(
        cleanConversationId,
        model.messageId,
        model.userId
    );
    const currentReaction = await getDoc(reactionReference);

    if (
        currentReaction.exists() &&
        currentReaction.data().reaction === model.reaction
    ) {
        return removeReaction(
            cleanConversationId,
            model.messageId,
            model.userId
        );
    }

    return addReaction(
        cleanConversationId,
        model.messageId,
        model.userId,
        model.reaction
    );
}

export function copyMessage(text) {
    return navigator.clipboard.writeText(text);
}

export function startReply(message) {
    return {
        id: message.id,
        senderName: message.senderName,
        preview: message.deletedAt
            ? "Deleted message"
            : message.text || message.fileName || "Attachment"
    };
}
