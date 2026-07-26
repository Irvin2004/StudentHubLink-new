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
    runTransaction,
    serverTimestamp,
    setDoc,
    arrayUnion,
    updateDoc,
    where,
    writeBatch
} from "firebase/firestore";

import { db } from "../../src/firebase/firestore.js";
import { COLLECTIONS } from "../config/firestore.js";
import { MESSAGE_TYPES } from "../config/message-types.js";
import {
    MESSAGE_STATUS,
    isValidMessageStatus
} from "../config/message-status.js";
import { createReadReceiptModel } from "../models/read-receipt.js";
import { createReactionModel } from "../models/reaction.js";
import { createMessageModel } from "../models/message.js";
import { emitMessageSent } from "../events/message-events.js";
import { logError } from "./error-service.js";
import { getConversationById } from "./conversation-service.js";
import {
    deleteVoiceMessage,
    uploadVoiceMessage
} from "./storage-service.js?voice=1";

export { MESSAGE_TYPES };

export function createMessageId() {
    return doc(collection(db, COLLECTIONS.MESSAGES)).id;
}

function normalizeMessage(messageId, data = {}) {
    const replySource = data.reply || data.replyTo || null;
    const reply = replySource
        ? {
              messageId: replySource.messageId || replySource.id || "",
              senderId: replySource.senderId || "",
              preview: replySource.preview || "Message",
              type: replySource.type || MESSAGE_TYPES.TEXT
          }
        : null;

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
        voice: data.voice
            ? {
                  url: data.voice.url || "",
                  storagePath: data.voice.storagePath || "",
                  duration: Number(data.voice.duration || 0),
                  mimeType: data.voice.mimeType || "",
                  size: Number(data.voice.size || 0)
              }
            : null,
        createdAt: data.createdAt || null,
        edited: data.edited === true,
        editedAt: data.editedAt || null,
        deleted: data.deleted === true || Boolean(data.deletedAt),
        deletedFor: Array.isArray(data.deletedFor) ? data.deletedFor : [],
        deletedAt: data.deletedAt || null,
        deliveredAt: data.deliveredAt || null,
        readAt: data.readAt || null,
        readBy: Array.isArray(data.readBy) ? data.readBy : [],
        reactions: data.reactions || {},
        reply,
        replyTo: reply
            ? {
                  ...reply,
                  senderName: replySource.senderName || ""
              }
            : null
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
    voice = null,
    reply = null
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
        voice: voice
            ? {
                  url: voice.url,
                  storagePath: voice.storagePath,
                  duration: voice.duration,
                  mimeType: voice.mimeType,
                  size: voice.size
              }
            : null,
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
        ...(reply ? { reply } : {})
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
    return doc(getReactionsCollection(conversationId, messageId), userId);
}

function normalizeReaction(reactionDocument) {
    return {
        userId: reactionDocument.id,
        reaction: reactionDocument.data().reaction
    };
}

function getReadReceiptsCollection(conversationId, messageId) {
    return collection(
        db,
        COLLECTIONS.CONVERSATIONS,
        conversationId,
        COLLECTIONS.MESSAGES,
        messageId,
        "readReceipts"
    );
}

function getReadReceiptReference(conversationId, messageId, userId) {
    return doc(getReadReceiptsCollection(conversationId, messageId), userId);
}

function validateReceiptStatus(status) {
    if (!isValidMessageStatus(status)) {
        throw new Error("Invalid message status.");
    }

    return status;
}

function normalizeReadReceipt(receiptDocument) {
    const data = receiptDocument.data();

    return {
        userId: receiptDocument.id,
        status: validateReceiptStatus(data.status),
        deliveredAt: data.deliveredAt || null,
        readAt: data.readAt || null,
        updatedAt: data.updatedAt || null
    };
}

export async function sendMessage(input) {
    const {
        conversationId,
        senderId,
        receiverId,
        messageId = createMessageId()
    } = input;

    const requestedConversationType =
        input.conversationType ||
        (input.type === "group" || input.type === "direct"
            ? input.type
            : input.groupId
              ? "group"
              : "direct");
    const isGroupMessage = requestedConversationType === "group";
    const messageInput =
        input.type === "group" || input.type === "direct"
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

    const replySource = input.reply || input.replyTo || null;
    const normalizedModel = createMessageModel({
        conversationId,
        senderId,
        receiverId: messageInput.receiverId,
        groupId: messageInput.groupId,
        type: messageInput.type || MESSAGE_TYPES.TEXT,
        content: messageInput.text,
        voice: messageInput.voice,
        reply: replySource
    });
    const message = createMessageDocument({
        ...messageInput,
        reply: normalizedModel.reply || null
    });

    if (
        (message.type === MESSAGE_TYPES.TEXT ||
            message.type === MESSAGE_TYPES.SYSTEM) &&
        !message.text
    ) {
        throw new Error("Message cannot be empty.");
    }

    if (
        (message.type === MESSAGE_TYPES.IMAGE ||
            message.type === MESSAGE_TYPES.FILE) &&
        !message.fileUrl
    ) {
        throw new Error("Message attachment is missing.");
    }

    if (
        message.type === MESSAGE_TYPES.VOICE &&
        (!message.voice?.url || !message.voice.storagePath)
    ) {
        throw new Error("Voice message metadata is incomplete.");
    }

    const batch = writeBatch(db);
    const messageRef = doc(db, COLLECTIONS.MESSAGES, messageId);
    const conversationRef = doc(db, COLLECTIONS.CONVERSATIONS, conversationId);

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
        logError(error, "Message notification event failed");
    }

    return messageId;
}

export async function sendReplyMessage({
    conversationId,
    senderId,
    content,
    reply,
    senderName = "Student"
} = {}) {
    const cleanConversationId = validateId(conversationId, "Conversation ID");
    const cleanSenderId = validateId(senderId, "Sender ID");
    const conversation = await getConversationById(cleanConversationId);
    const isGroupMessage = conversation.type === "group";
    const receiverId = isGroupMessage
        ? null
        : conversation.participantIds.find(
              (participantId) => participantId !== cleanSenderId
          );

    if (
        (!isGroupMessage &&
            (!receiverId ||
                !conversation.participantIds.includes(cleanSenderId))) ||
        (isGroupMessage && !conversation.groupId)
    ) {
        throw new Error("Conversation participant information is incomplete.");
    }

    return sendMessage({
        conversationId: cleanConversationId,
        senderId: cleanSenderId,
        receiverId,
        groupId: isGroupMessage ? conversation.groupId : null,
        conversationType: isGroupMessage ? "group" : "direct",
        senderName,
        type: MESSAGE_TYPES.TEXT,
        text: content,
        reply
    });
}

export async function sendVoiceMessage({
    conversationId,
    senderId,
    blob,
    duration,
    mimeType,
    senderName = "Student",
    onProgress = () => {}
}) {
    const cleanConversationId = validateId(conversationId, "Conversation ID");
    const cleanSenderId = validateId(senderId, "Sender ID");
    const cleanMimeType =
        typeof mimeType === "string" ? mimeType.trim().toLowerCase() : "";
    const cleanDuration = Number(duration);

    if (!(blob instanceof Blob) || blob.size <= 0) {
        throw new Error("A recorded audio blob is required.");
    }

    if (!/^audio\/(webm|ogg)(;.*)?$/.test(cleanMimeType)) {
        throw new Error("Voice message must use WebM or Ogg audio.");
    }

    if (
        !Number.isFinite(cleanDuration) ||
        cleanDuration < 0 ||
        cleanDuration > 5 * 60 * 1000
    ) {
        throw new Error("Voice message duration must be five minutes or less.");
    }

    const conversation = await getConversationById(cleanConversationId);
    const isGroupMessage = conversation.type === "group";
    const receiverId = isGroupMessage
        ? null
        : conversation.participantIds.find(
              (participantId) => participantId !== cleanSenderId
          );

    if (
        (!isGroupMessage &&
            (!receiverId ||
                !conversation.participantIds.includes(cleanSenderId))) ||
        (isGroupMessage && !conversation.groupId)
    ) {
        throw new Error("Conversation participant information is incomplete.");
    }

    const uploaded = await uploadVoiceMessage(
        cleanConversationId,
        cleanSenderId,
        blob,
        onProgress
    );

    try {
        const voiceMessage = createMessageModel({
            conversationId: cleanConversationId,
            senderId: cleanSenderId,
            receiverId,
            groupId: isGroupMessage ? conversation.groupId : null,
            type: MESSAGE_TYPES.VOICE,
            voice: {
                url: uploaded.downloadURL,
                storagePath: uploaded.storagePath,
                duration: cleanDuration,
                mimeType: cleanMimeType,
                size: uploaded.size
            }
        });

        return await sendMessage({
            conversationId: cleanConversationId,
            senderId: cleanSenderId,
            receiverId,
            groupId: isGroupMessage ? conversation.groupId : null,
            conversationType: isGroupMessage ? "group" : "direct",
            senderName,
            type: MESSAGE_TYPES.VOICE,
            voice: voiceMessage.voice
        });
    } catch (error) {
        try {
            await deleteVoiceMessage(uploaded.storagePath);
        } catch (cleanupError) {
            logError(cleanupError, "Voice message cleanup failed");
        }

        throw error;
    }
}

export async function editMessage({ conversationId, messageId, newText }) {
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

    await updateDoc(doc(db, COLLECTIONS.MESSAGES, messageId), {
        text: cleanText,
        edited: true,
        editedAt: serverTimestamp()
    });
}

export async function deleteMessageForEveryone({ conversationId, messageId }) {
    if (!conversationId || !messageId) {
        throw new Error("Message information is incomplete.");
    }

    const messageReference = doc(db, COLLECTIONS.MESSAGES, messageId);
    const messageSnapshot = await getDoc(messageReference);

    if (!messageSnapshot.exists()) {
        throw new Error("Message does not exist.");
    }

    const message = messageSnapshot.data();

    if (message.conversationId !== conversationId) {
        throw new Error("Message does not belong to this conversation.");
    }

    if (message.type === MESSAGE_TYPES.VOICE && message.voice?.storagePath) {
        await deleteVoiceMessage(message.voice.storagePath);
    }

    await updateDoc(messageReference, {
        text: "This message was deleted.",
        deleted: true,
        deletedAt: serverTimestamp(),
        fileUrl: null,
        fileName: null,
        fileSize: null,
        mimeType: null,
        voice: null
    });
}

export async function deleteMessageForMe({
    conversationId,
    messageId,
    userId
}) {
    if (!conversationId || !messageId || !userId) {
        throw new Error("Message information is incomplete.");
    }

    await updateDoc(doc(db, COLLECTIONS.MESSAGES, messageId), {
        deletedFor: arrayUnion(userId)
    });
}

export function subscribeToMessages(conversationId, callback, onError) {
    const messagesQuery = query(
        collection(db, COLLECTIONS.MESSAGES),
        where("conversationId", "==", conversationId),
        orderBy("createdAt", "asc"),
        limitToLast(200)
    );

    return onSnapshot(
        messagesQuery,
        (snapshot) => {
            callback(
                snapshot.docs.map((messageDocument) =>
                    normalizeMessage(messageDocument.id, messageDocument.data())
                )
            );
        },
        (error) => {
            logError(error, "Message listener failed");

            if (typeof onError === "function") {
                onError(error);
            }
        }
    );
}

export async function markMessagesAsDelivered(messages, currentUserId) {
    const undeliveredMessages = messages.filter(
        (message) =>
            message.receiverId === currentUserId && !message.deliveredAt
    );

    await Promise.all(
        undeliveredMessages.map((message) =>
            updateDoc(doc(db, COLLECTIONS.MESSAGES, message.id), {
                deliveredAt: serverTimestamp()
            })
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
            return (
                message.senderId !== currentUserId &&
                !(message.readBy || []).includes(currentUserId)
            );
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
export async function addReaction(conversationId, messageId, userId, reaction) {
    const cleanConversationId = validateId(conversationId, "Conversation ID");
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

export async function removeReaction(conversationId, messageId, userId) {
    const cleanConversationId = validateId(conversationId, "Conversation ID");
    const cleanMessageId = validateId(messageId, "Message ID");
    const cleanUserId = validateId(userId, "User ID");

    await deleteDoc(
        getReactionReference(cleanConversationId, cleanMessageId, cleanUserId)
    );
}

export async function getMessageReactions(conversationId, messageId) {
    const cleanConversationId = validateId(conversationId, "Conversation ID");
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
    const cleanConversationId = validateId(conversationId, "Conversation ID");
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

            logError(error, "Reaction listener failed");
        }
    );
}

export async function markMessageDelivered(conversationId, messageId, userId) {
    const cleanConversationId = validateId(conversationId, "Conversation ID");
    const receipt = createReadReceiptModel({
        conversationId: cleanConversationId,
        messageId,
        userId
    });
    const status = validateReceiptStatus(MESSAGE_STATUS.DELIVERED);
    const receiptReference = getReadReceiptReference(
        receipt.conversationId,
        receipt.messageId,
        receipt.userId
    );

    return runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(receiptReference);

        if (snapshot.exists()) {
            return normalizeReadReceipt(snapshot);
        }

        transaction.set(receiptReference, {
            status,
            deliveredAt: serverTimestamp(),
            readAt: null,
            updatedAt: serverTimestamp()
        });

        return {
            userId: receipt.userId,
            status,
            deliveredAt: null,
            readAt: null,
            updatedAt: null
        };
    });
}

export async function markMessageRead(conversationId, messageId, userId) {
    const cleanConversationId = validateId(conversationId, "Conversation ID");
    const receipt = createReadReceiptModel({
        conversationId: cleanConversationId,
        messageId,
        userId
    });
    const status = validateReceiptStatus(MESSAGE_STATUS.READ);
    const receiptReference = getReadReceiptReference(
        receipt.conversationId,
        receipt.messageId,
        receipt.userId
    );

    return runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(receiptReference);
        const existingData = snapshot.exists() ? snapshot.data() : {};

        if (snapshot.exists()) {
            validateReceiptStatus(existingData.status);
        }

        if (snapshot.exists() && existingData.status === MESSAGE_STATUS.READ) {
            return normalizeReadReceipt(snapshot);
        }

        transaction.set(
            receiptReference,
            {
                status,
                deliveredAt: existingData.deliveredAt || serverTimestamp(),
                readAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            },
            { merge: true }
        );

        return {
            userId: receipt.userId,
            status,
            deliveredAt: existingData.deliveredAt || null,
            readAt: null,
            updatedAt: null
        };
    });
}

export async function getReadReceipts(conversationId, messageId) {
    const cleanConversationId = validateId(conversationId, "Conversation ID");
    const cleanMessageId = validateId(messageId, "Message ID");
    const snapshot = await getDocs(
        getReadReceiptsCollection(cleanConversationId, cleanMessageId)
    );

    return snapshot.docs.map(normalizeReadReceipt);
}

export function subscribeToReadReceipts(
    conversationId,
    messageId,
    callback,
    onError
) {
    const cleanConversationId = validateId(conversationId, "Conversation ID");
    const cleanMessageId = validateId(messageId, "Message ID");

    if (typeof callback !== "function") {
        throw new Error("Read receipt subscriber is required.");
    }

    return onSnapshot(
        getReadReceiptsCollection(cleanConversationId, cleanMessageId),
        (snapshot) => callback(snapshot.docs.map(normalizeReadReceipt)),
        (error) => {
            if (typeof onError === "function") {
                onError(error);
                return;
            }

            logError(error, "Read receipt listener failed");
        }
    );
}

export function copyMessage(text) {
    return navigator.clipboard.writeText(text);
}

export function startReply(message) {
    return {
        messageId: message.id,
        senderId: message.senderId,
        senderName: message.senderName,
        preview: message.deletedAt
            ? "Deleted message"
            : message.text || message.fileName || "Attachment",
        type: message.type || MESSAGE_TYPES.TEXT
    };
}
