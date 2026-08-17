import {
    arrayRemove,
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    endBefore,
    getDocs,
    limit,
    limitToLast,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc
} from "firebase/firestore";

import { MESSAGE_PAGE_SIZE, MESSAGE_TYPES } from "../config/message-types.js";
import { ACTIVITY_TYPES } from "../config/activity-types.js";
import { CHANNEL_TYPES } from "../config/channel-types.js";
import { isReactionType, REACTION_KEYS } from "../config/reaction-types.js";
import { auth, db } from "../firebase/index.js";
import { createMessageModel, validateMessageInput } from "../models/message.js";
import { createNotification } from "./notification-service.js";
import { createActivity } from "./activity-service.js";
import { parseMentions } from "../utils/mention-parser.js";

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

async function notifyCommunityMembers(messageId, message) {
    const snapshot = await getDocs(
        query(
            collection(db, COMMUNITIES, message.communityId, "members"),
            limit(500)
        )
    );
    if (!snapshot?.docs) return;
    const mentions = parseMentions(message.text);
    const mentionedNames = new Set(mentions.users);
    const recipients = snapshot.docs.filter(
        (item) => item.id !== message.senderId
    );
    await Promise.allSettled(
        recipients.map((item) => {
            const nickname = String(item.data().nickname || "").toLowerCase();
            const mentioned = mentions.channel || mentionedNames.has(nickname);
            return createNotification(item.id, {
                senderId: message.senderId,
                senderName: message.senderName,
                type: mentioned
                    ? mentions.channel
                        ? "channel_mention"
                        : "mention"
                    : "new_message",
                title: mentioned
                    ? `${message.senderName} mentioned you`
                    : `New message in #${message.channelId}`,
                message: message.text || "Shared an attachment",
                communityId: message.communityId,
                channelId: message.channelId,
                referenceId: messageId,
                route: `/community/${message.communityId}/channel/${message.channelId}`
            });
        })
    );
}

export async function sendMessage(input) {
    const validated = validateMessageInput({
        ...input,
        senderId: input.senderId || auth.currentUser?.uid
    });
    const reference = input.id
        ? messageReference(validated.communityId, validated.channelId, input.id)
        : doc(messagesReference(validated.communityId, validated.channelId));
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
        pinnedAt: null,
        pinnedBy: null,
        readBy: [validated.senderId],
        createdAt: timestamp,
        updatedAt: timestamp
    };

    await setDoc(reference, data);
    if (input.channelType === CHANNEL_TYPES.ANNOUNCEMENTS) {
        void createActivity(validated.communityId, {
            type: ACTIVITY_TYPES.ANNOUNCEMENT_POSTED,
            actorId: validated.senderId,
            actorName: validated.senderName,
            title: `New announcement in #${validated.channelId}`,
            description: validated.text || "Shared an announcement",
            channelId: validated.channelId,
            referenceId: reference.id
        }).catch(() => {});
    }
    void notifyCommunityMembers(reference.id, validated);
    return createMessageModel({
        id: reference.id,
        communityId: validated.communityId,
        ...data
    });
}

export function createMessageId(communityId, channelId) {
    return doc(messagesReference(communityId, channelId)).id;
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

export async function pinMessage(communityId, channelId, messageId, userId) {
    await updateDoc(messageReference(communityId, channelId, messageId), {
        pinnedAt: serverTimestamp(),
        pinnedBy: requireUserId(userId),
        updatedAt: serverTimestamp()
    });
}

export async function unpinMessage(communityId, channelId, messageId, userId) {
    requireUserId(userId);
    await updateDoc(messageReference(communityId, channelId, messageId), {
        pinnedAt: null,
        pinnedBy: null,
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
        query(reference, limit(50)),
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
