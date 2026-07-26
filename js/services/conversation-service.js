import {
    addDoc,
    collection,
    collectionGroup,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    runTransaction,
    serverTimestamp,
    setDoc,
    where
} from "firebase/firestore";

import { db } from "../../src/firebase/firestore.js";
import { COLLECTIONS } from "../config/firestore.js?preferences=2";
import { areMutuals } from "./follows-service.js";
import { log } from "../utils/logger.js";
import { createConversationPreferenceModel } from "../models/conversation-preference.js";
import { sortConversations } from "../utils/conversation-sorter.js";

function validatePreferenceId(value, fieldName) {
    const normalized = typeof value === "string" ? value.trim() : "";

    if (!normalized) {
        throw new Error(`${fieldName} is required.`);
    }

    return normalized;
}

function getConversationPreferencesCollection(userId) {
    return collection(
        db,
        COLLECTIONS.USERS,
        validatePreferenceId(userId, "User ID"),
        COLLECTIONS.CONVERSATION_PREFERENCES
    );
}

function getConversationPreferenceReference(userId, conversationId) {
    return doc(
        getConversationPreferencesCollection(userId),
        validatePreferenceId(conversationId, "Conversation ID")
    );
}

function normalizeConversationPreference(snapshot, userId) {
    return createConversationPreferenceModel({
        ...snapshot.data(),
        conversationId: snapshot.id,
        userId
    });
}

async function updateConversationPreference(userId, conversationId, updates) {
    const cleanUserId = validatePreferenceId(userId, "User ID");
    const cleanConversationId = validatePreferenceId(
        conversationId,
        "Conversation ID"
    );
    const preferenceReference = getConversationPreferenceReference(
        cleanUserId,
        cleanConversationId
    );

    return runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(preferenceReference);
        const existing = snapshot.exists() ? snapshot.data() : {};
        const resolvedUpdates =
            typeof updates === "function" ? updates(existing) : updates;
        const preference = createConversationPreferenceModel({
            ...existing,
            ...resolvedUpdates,
            conversationId: cleanConversationId,
            userId: cleanUserId
        });

        transaction.set(preferenceReference, {
            conversationId: preference.conversationId,
            userId: preference.userId,
            pinned: preference.pinned,
            muted: preference.muted,
            archived: preference.archived,
            createdAt: existing.createdAt || serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        return preference;
    });
}

export function getConversationKey(firstUserId, secondUserId) {
    return [firstUserId, secondUserId].sort().join("_");
}

function normalizeConversation(conversationId, data = {}) {
    return {
        id: conversationId,
        type: data.type || "direct",
        participantIds: data.participantIds || [],
        groupId: data.groupId || null,
        title: data.title || "",
        memberCount: Number(data.memberCount || 0),
        conversationKey: data.conversationKey || "",
        lastMessage: data.lastMessage || "",
        lastMessageType: data.lastMessageType || "text",
        lastMessageSenderId: data.lastMessageSenderId || null,
        lastMessageAt: data.lastMessageAt || null,
        unreadCounts: data.unreadCounts || {},
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null
    };
}

export async function getUserProfile(userId) {
    if (!userId) return null;

    const snapshot = await getDoc(doc(db, COLLECTIONS.USERS, userId));

    if (!snapshot.exists()) return null;

    return {
        id: snapshot.id,
        ...snapshot.data()
    };
}

export async function getConversation(firstUserId, secondUserId) {
    const conversationQuery = query(
        collection(db, COLLECTIONS.CONVERSATIONS),
        where(
            "conversationKey",
            "==",
            getConversationKey(firstUserId, secondUserId)
        )
    );

    const snapshot = await getDocs(conversationQuery);

    if (snapshot.empty) return null;

    const conversationDocument = snapshot.docs[0];

    return normalizeConversation(
        conversationDocument.id,
        conversationDocument.data()
    );
}

export async function getConversationById(conversationId) {
    if (!conversationId) {
        throw new Error("Conversation does not exist.");
    }

    const snapshot = await getDoc(
        doc(db, COLLECTIONS.CONVERSATIONS, conversationId)
    );

    if (!snapshot.exists()) {
        throw new Error("Conversation does not exist.");
    }

    return normalizeConversation(snapshot.id, snapshot.data());
}

export function pinConversation(userId, conversationId) {
    return updateConversationPreference(userId, conversationId, {
        pinned: true
    });
}

export function unpinConversation(userId, conversationId) {
    return updateConversationPreference(userId, conversationId, {
        pinned: false
    });
}

export function muteConversation(userId, conversationId) {
    return updateConversationPreference(userId, conversationId, {
        muted: true
    });
}

export function unmuteConversation(userId, conversationId) {
    return updateConversationPreference(userId, conversationId, {
        muted: false
    });
}

export function toggleMuteConversation(userId, conversationId) {
    return updateConversationPreference(
        userId,
        conversationId,
        (preference) => ({ muted: !preference.muted })
    );
}

export function archiveConversation(userId, conversationId) {
    return updateConversationPreference(userId, conversationId, {
        archived: true
    });
}

export function unarchiveConversation(userId, conversationId) {
    return updateConversationPreference(userId, conversationId, {
        archived: false
    });
}

export function toggleArchiveConversation(userId, conversationId) {
    return updateConversationPreference(
        userId,
        conversationId,
        (preference) => ({ archived: !preference.archived })
    );
}

export async function getConversationPreference(userId, conversationId) {
    const cleanUserId = validatePreferenceId(userId, "User ID");
    const cleanConversationId = validatePreferenceId(
        conversationId,
        "Conversation ID"
    );
    const snapshot = await getDoc(
        getConversationPreferenceReference(cleanUserId, cleanConversationId)
    );

    if (!snapshot.exists()) {
        return createConversationPreferenceModel({
            conversationId: cleanConversationId,
            userId: cleanUserId
        });
    }

    return normalizeConversationPreference(snapshot, cleanUserId);
}

export function subscribeToConversationPreferences(userId, callback, onError) {
    const cleanUserId = validatePreferenceId(userId, "User ID");

    if (typeof callback !== "function") {
        throw new Error("Conversation preference subscriber is required.");
    }

    const reportError = (error) => {
        log("CONVERSATIONS", "Conversation preference listener failed:", error);
        if (typeof onError === "function") onError(error);
    };

    return onSnapshot(
        getConversationPreferencesCollection(cleanUserId),
        (snapshot) => {
            try {
                callback(
                    snapshot.docs.map((preferenceDocument) =>
                        normalizeConversationPreference(
                            preferenceDocument,
                            cleanUserId
                        )
                    )
                );
            } catch (error) {
                reportError(error);
            }
        },
        reportError
    );
}

export function subscribeToUserConversations(userId, callback, onError) {
    const directConversations = new Map();
    const groupConversations = new Map();
    let groupUnsubscribers = [];

    const emit = () => {
        const conversations = sortConversations([
            ...directConversations.values(),
            ...groupConversations.values()
        ]);

        callback(conversations);
    };

    const reportError = (error) => {
        log("CONVERSATIONS", "Conversation listener failed:", error);
        if (typeof onError === "function") onError(error);
    };

    const directQuery = query(
        collection(db, COLLECTIONS.CONVERSATIONS),
        where("participantIds", "array-contains", userId),
        orderBy("lastMessageAt", "desc")
    );

    const unsubscribeDirect = onSnapshot(
        directQuery,
        (snapshot) => {
            directConversations.clear();
            snapshot.docs.forEach((conversationDocument) => {
                const conversation = normalizeConversation(
                    conversationDocument.id,
                    conversationDocument.data()
                );
                directConversations.set(conversation.id, conversation);
            });
            emit();
        },
        reportError
    );

    const membershipsQuery = query(
        collectionGroup(db, "members"),
        where("userId", "==", userId)
    );

    const unsubscribeMemberships = onSnapshot(
        membershipsQuery,
        (snapshot) => {
            groupUnsubscribers.forEach((unsubscribe) => unsubscribe());
            groupUnsubscribers = [];
            groupConversations.clear();

            const groupIds = [
                ...new Set(
                    snapshot.docs
                        .map(
                            (memberDocument) =>
                                memberDocument.ref.parent.parent?.id
                        )
                        .filter(Boolean)
                )
            ];

            if (!groupIds.length) {
                emit();
                return;
            }

            for (let index = 0; index < groupIds.length; index += 30) {
                const groupIdChunk = groupIds.slice(index, index + 30);
                const groupQuery = query(
                    collection(db, COLLECTIONS.CONVERSATIONS),
                    where("groupId", "in", groupIdChunk)
                );

                groupUnsubscribers.push(
                    onSnapshot(
                        groupQuery,
                        (groupSnapshot) => {
                            groupIdChunk.forEach((groupId) => {
                                const conversationId = `group_${groupId}`;
                                groupConversations.delete(conversationId);
                            });

                            groupSnapshot.docs.forEach(
                                (conversationDocument) => {
                                    const conversation = normalizeConversation(
                                        conversationDocument.id,
                                        conversationDocument.data()
                                    );
                                    groupConversations.set(
                                        conversation.id,
                                        conversation
                                    );
                                }
                            );
                            emit();
                        },
                        reportError
                    )
                );
            }
        },
        reportError
    );

    return () => {
        unsubscribeDirect();
        unsubscribeMemberships();
        groupUnsubscribers.forEach((unsubscribe) => unsubscribe());
    };
}
export async function createOrGetConversation(firstUserId, secondUserId) {
    if (!firstUserId || !secondUserId) {
        throw new Error("Conversation users are missing.");
    }

    if (firstUserId === secondUserId) {
        throw new Error("You cannot message yourself.");
    }

    if (!(await areMutuals(firstUserId, secondUserId))) {
        throw new Error("You can only message mutual followers.");
    }

    const existingConversation = await getConversation(
        firstUserId,
        secondUserId
    );

    if (existingConversation) return existingConversation;

    const participantIds = [firstUserId, secondUserId].sort();
    const conversationKey = getConversationKey(firstUserId, secondUserId);
    const unreadCounts = Object.fromEntries(
        participantIds.map((userId) => [userId, 0])
    );

    const conversationReference = await addDoc(
        collection(db, COLLECTIONS.CONVERSATIONS),
        {
            type: "direct",
            conversationKey,
            participantIds,
            lastMessage: "",
            lastMessageType: "text",
            lastMessageSenderId: null,
            lastMessageAt: serverTimestamp(),
            unreadCounts,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        }
    );

    return {
        id: conversationReference.id,
        type: "direct",
        conversationKey,
        participantIds,
        lastMessage: "",
        lastMessageType: "text",
        lastMessageSenderId: null,
        unreadCounts
    };
}

export async function createOrGetGroupConversation({
    groupId,
    title,
    memberCount = 0
}) {
    if (!groupId || !title?.trim()) {
        throw new Error("Group conversation information is missing.");
    }

    const conversationReference = doc(
        db,
        COLLECTIONS.CONVERSATIONS,
        `group_${groupId}`
    );
    const existingSnapshot = await getDoc(conversationReference);

    if (!existingSnapshot.exists()) {
        await setDoc(conversationReference, {
            type: "group",
            groupId,
            title: title.trim(),
            memberCount: Number(memberCount || 0),
            lastMessage: "",
            lastMessageType: "text",
            lastMessageSenderId: null,
            lastMessageAt: serverTimestamp(),
            unreadCounts: {},
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    }

    const snapshot = existingSnapshot.exists()
        ? existingSnapshot
        : await getDoc(conversationReference);

    return normalizeConversation(snapshot.id, snapshot.data());
}
