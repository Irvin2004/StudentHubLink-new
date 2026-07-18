import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    where
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import { db } from "../firebase.js";
import { COLLECTIONS } from "../config/firestore.js";
import { areMutuals } from "./follows-service.js";

export function getConversationKey(firstUserId, secondUserId) {
    return [firstUserId, secondUserId]
        .sort()
        .join("_");
}

function normalizeConversation(conversationId, data = {}) {
    return {
        id: conversationId,
        participantIds: data.participantIds || [],
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

    const snapshot = await getDoc(
        doc(db, COLLECTIONS.USERS, userId)
    );

    if (!snapshot.exists()) return null;

    return {
        id: snapshot.id,
        ...snapshot.data()
    };
}

export async function getConversation(
    firstUserId,
    secondUserId
) {
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

export function subscribeToUserConversations(
    userId,
    callback,
    onError
) {
    const conversationsQuery = query(
        collection(db, COLLECTIONS.CONVERSATIONS),
        where("participantIds", "array-contains", userId),
        orderBy("lastMessageAt", "desc")
    );

    return onSnapshot(
        conversationsQuery,
        (snapshot) => {
            callback(snapshot.docs.map((conversationDocument) =>
                normalizeConversation(
                    conversationDocument.id,
                    conversationDocument.data()
                )
            ));
        },
        (error) => {
            console.error("Conversation listener failed:", error);

            if (typeof onError === "function") {
                onError(error);
            }
        }
    );
}

export async function createOrGetConversation(
    firstUserId,
    secondUserId
) {
    if (!firstUserId || !secondUserId) {
        throw new Error("Conversation users are missing.");
    }

    if (firstUserId === secondUserId) {
        throw new Error("You cannot message yourself.");
    }

    if (!await areMutuals(firstUserId, secondUserId)) {
        throw new Error("You can only message mutual followers.");
    }

    const existingConversation = await getConversation(
        firstUserId,
        secondUserId
    );

    if (existingConversation) return existingConversation;

    const participantIds = [firstUserId, secondUserId].sort();
    const conversationKey = getConversationKey(
        firstUserId,
        secondUserId
    );
    const unreadCounts = Object.fromEntries(
        participantIds.map((userId) => [userId, 0])
    );

    const conversationReference = await addDoc(
        collection(db, COLLECTIONS.CONVERSATIONS),
        {
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
        conversationKey,
        participantIds,
        lastMessage: "",
        lastMessageType: "text",
        lastMessageSenderId: null,
        unreadCounts
    };
}
