import {
    collection,
    doc,
    getDocs,
    increment,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where,
    writeBatch
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import { db } from "../firebase.js";
import { COLLECTIONS } from "../config/firestore.js";
import { MESSAGE_TYPES } from "../utils/constants.js?messaging=13";

export { MESSAGE_TYPES };

export function createMessageId() {
    return doc(collection(db, COLLECTIONS.MESSAGES)).id;
}

function normalizeMessage(messageId, data = {}) {
    return {
        id: messageId,
        conversationId: data.conversationId || "",
        senderId: data.senderId || "",
        receiverId: data.receiverId || "",
        type: data.type || MESSAGE_TYPES.TEXT,
        text: data.text || "",
        fileUrl: data.fileUrl || null,
        fileName: data.fileName || null,
        mimeType: data.mimeType || null,
        fileSize: data.fileSize ?? null,
        createdAt: data.createdAt || null,
        editedAt: data.editedAt || null,
        deletedAt: data.deletedAt || null,
        deliveredAt: data.deliveredAt || null,
        readAt: data.readAt || null,
        reactions: data.reactions || {},
        replyTo: data.replyTo || null
    };
}

function createMessageDocument({
    conversationId,
    senderId,
    receiverId,
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
        type,
        text: text.trim(),
        fileUrl,
        fileName,
        mimeType,
        fileSize,
        createdAt: serverTimestamp(),
        editedAt: null,
        deletedAt: null,
        deliveredAt: null,
        readAt: null,
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

export async function sendMessage(input) {
    const {
        conversationId,
        senderId,
        receiverId,
        messageId = createMessageId()
    } = input;

    if (!conversationId || !senderId || !receiverId) {
        throw new Error("Message information is incomplete.");
    }

    const message = createMessageDocument(input);

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
    batch.update(conversationRef, {
        lastMessage: getConversationPreview(message),
        lastMessageType: message.type,
        lastMessageSenderId: senderId,
        lastMessageAt: serverTimestamp(),
        [`unreadCounts.${receiverId}`]: increment(1),
        updatedAt: serverTimestamp()
    });

    await batch.commit();

    return messageId;
}

export function subscribeToMessages(
    conversationId,
    callback,
    onError
) {
    const messagesQuery = query(
        collection(db, COLLECTIONS.MESSAGES),
        where("conversationId", "==", conversationId),
        orderBy("createdAt", "asc")
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
    currentUserId
) {
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
        batch.update(messageDocument.ref, {
            readAt: serverTimestamp()
        });
    });

    batch.update(
        doc(db, COLLECTIONS.CONVERSATIONS, conversationId),
        {
            [`unreadCounts.${currentUserId}`]: 0,
            updatedAt: serverTimestamp()
        }
    );

    await batch.commit();
}
