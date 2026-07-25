import {
    arrayRemove,
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    endBefore,
    getDocs,
    limitToLast,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc
} from "firebase/firestore";

import { MESSAGE_PAGE_SIZE, MESSAGE_TYPES } from "../config/message-types.js";
import { isReactionType, REACTION_KEYS } from "../config/reaction-types.js";
import { auth, db } from "../firebase/index.js";
import { createMessageModel, validateMessageInput } from "../models/message.js";

const COMMUNITIES = "communities";
const CHANNELS = "channels";
const MESSAGES = "messages";
const TYPING = "typing";

function requireId(value, label) {
    const id = String(value ?? "").trim();
    if (!id) throw new TypeError(`${label} is required.`);
    return id;
}

function requireUserId(userId) {
    return requireId(userId || auth.currentUser?.uid, "A user ID");
}

function messagesReference(communityId, channelId) {
    return collection(
        db,
        COMMUNITIES,
        requireId(communityId, "A community ID"),
        CHANNELS,
        requireId(channelId, "A channel ID"),
        MESSAGES
    );
}

function messageReference(communityId, channelId, messageId) {
    return doc(
        messagesReference(communityId, channelId),
        requireId(messageId, "A message ID")
    );
}

function typingReference(communityId, channelId, userId) {
    return doc(
        db,
        COMMUNITIES,
        requireId(communityId, "A community ID"),
        CHANNELS,
        requireId(channelId, "A channel ID"),
        TYPING,
        requireUserId(userId)
    );
}

function fromSnapshot(snapshot, communityId, channelId) {
    return createMessageModel({
        id: snapshot.id,
        communityId,
        channelId,
        ...snapshot.data()
    });
}

export async function sendMessage(input) {
    const validated = validateMessageInput({
        ...input,
        senderId: input.senderId || auth.currentUser?.uid
    });
    const reference = doc(
        messagesReference(validated.communityId, validated.channelId)
    );
    const timestamp = serverTimestamp();
    const data = {
        channelId: validated.channelId,
        senderId: validated.senderId,
        senderName: validated.senderName,
        senderPhotoURL: validated.senderPhotoURL,
        text: validated.text,
        attachments: validated.attachments,
        replyTo: validated.replyTo,
        type: MESSAGE_TYPES.TEXT,
        reactions: {},
        edited: false,
        deleted: false,
        deletedAt: null,
        readBy: [validated.senderId],
        createdAt: timestamp,
        updatedAt: timestamp
    };

    await setDoc(reference, data);
    return createMessageModel({
        id: reference.id,
        communityId: validated.communityId,
        ...data
    });
}

export async function editMessage(
    communityId,
    channelId,
    messageId,
    text,
    userId
) {
    requireUserId(userId);
    const cleanText = String(text ?? "").trim();
    validateMessageInput({
        communityId,
        channelId,
        senderId: userId || auth.currentUser?.uid,
        text: cleanText
    });

    await updateDoc(messageReference(communityId, channelId, messageId), {
        text: cleanText,
        edited: true,
        updatedAt: serverTimestamp()
    });
}

export async function deleteMessage(communityId, channelId, messageId, userId) {
    requireUserId(userId);
    await updateDoc(messageReference(communityId, channelId, messageId), {
        text: "",
        attachments: [],
        deleted: true,
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
}

export function listenToMessages(
    communityId,
    channelId,
    onData,
    onError,
    pageSize = MESSAGE_PAGE_SIZE
) {
    const messagesQuery = query(
        messagesReference(communityId, channelId),
        orderBy("createdAt", "asc"),
        limitToLast(pageSize)
    );

    return onSnapshot(
        messagesQuery,
        (snapshot) =>
            onData({
                messages: snapshot.docs.map((item) =>
                    fromSnapshot(item, communityId, channelId)
                ),
                oldestSnapshot: snapshot.docs[0] || null
            }),
        onError
    );
}

export async function loadOlderMessages(
    communityId,
    channelId,
    oldestSnapshot,
    pageSize = MESSAGE_PAGE_SIZE
) {
    if (!oldestSnapshot) return { messages: [], oldestSnapshot: null };

    const historyQuery = query(
        messagesReference(communityId, channelId),
        orderBy("createdAt", "asc"),
        endBefore(oldestSnapshot),
        limitToLast(pageSize)
    );
    const snapshot = await getDocs(historyQuery);

    return {
        messages: snapshot.docs.map((item) =>
            fromSnapshot(item, communityId, channelId)
        ),
        oldestSnapshot: snapshot.docs[0] || null
    };
}

export async function addReaction(
    communityId,
    channelId,
    messageId,
    userId,
    reaction
) {
    if (!isReactionType(reaction)) {
        throw new TypeError("Unsupported reaction.");
    }

    await updateDoc(messageReference(communityId, channelId, messageId), {
        [`reactions.${REACTION_KEYS[reaction]}`]: arrayUnion(
            requireUserId(userId)
        ),
        updatedAt: serverTimestamp()
    });
}

export async function removeReaction(
    communityId,
    channelId,
    messageId,
    userId,
    reaction
) {
    if (!isReactionType(reaction)) {
        throw new TypeError("Unsupported reaction.");
    }

    await updateDoc(messageReference(communityId, channelId, messageId), {
        [`reactions.${REACTION_KEYS[reaction]}`]: arrayRemove(
            requireUserId(userId)
        ),
        updatedAt: serverTimestamp()
    });
}

export async function sendTyping(communityId, channelId, userId, displayName) {
    await setDoc(typingReference(communityId, channelId, userId), {
        userId: requireUserId(userId),
        displayName: String(displayName || "Student").trim(),
        updatedAt: serverTimestamp()
    });
}

export async function stopTyping(communityId, channelId, userId) {
    await deleteDoc(typingReference(communityId, channelId, userId));
}

export function listenToTyping(communityId, channelId, onData, onError) {
    const reference = collection(
        db,
        COMMUNITIES,
        requireId(communityId, "A community ID"),
        CHANNELS,
        requireId(channelId, "A channel ID"),
        TYPING
    );

    return onSnapshot(
        reference,
        (snapshot) =>
            onData(
                snapshot.docs.map((item) => ({
                    userId: item.id,
                    ...item.data()
                }))
            ),
        onError
    );
}
