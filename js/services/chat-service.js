import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    where
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import { db } from "../firebase.js";
import { COLLECTIONS } from "../config/firestore.js";
import { areMutuals } from "./follows-service.js";

function getConversationKey(firstUserId, secondUserId) {
    return [firstUserId, secondUserId]
        .sort()
        .join("_");
}

export async function getConversation(
    firstUserId,
    secondUserId
) {
    const conversationKey =
    getConversationKey(
        firstUserId,
        secondUserId
    );

    const conversationQuery = query(
        collection(
            db,
            COLLECTIONS.CONVERSATIONS
        ),
        where(
            "conversationKey",
            "==",
            conversationKey
        )
    );

    const snapshot =
    await getDocs(conversationQuery);

    if (snapshot.empty) {
        return null;
    }

    const conversationDoc =
    snapshot.docs[0];

    return {
        id: conversationDoc.id,
        ...conversationDoc.data()
    };
}

export async function getConversationById(conversationId) {
    if (!conversationId) {
        throw new Error("Conversation does not exist.");
    }

    const conversationSnap =
    await getDoc(
        doc(db, COLLECTIONS.CONVERSATIONS, conversationId)
    );

    if (!conversationSnap.exists()) {
        throw new Error("Conversation does not exist.");
    }

    return {
        id: conversationSnap.id,
        ...conversationSnap.data()
    };
}

export async function createOrGetConversation(
    firstUserId,
    secondUserId
) {
    if (!firstUserId || !secondUserId) {
        throw new Error(
            "Conversation users are missing."
        );
    }

    if (firstUserId === secondUserId) {
        throw new Error(
            "You cannot message yourself."
        );
    }

    const mutual =
    await areMutuals(
        firstUserId,
        secondUserId
    );

    if (!mutual) {
        throw new Error(
            "You can only message mutual followers."
        );
    }

    const existingConversation =
    await getConversation(
        firstUserId,
        secondUserId
    );

    if (existingConversation) {
        return existingConversation;
    }

    const participantIds =
    [firstUserId, secondUserId].sort();

    const conversationRef =
    await addDoc(
        collection(
            db,
            COLLECTIONS.CONVERSATIONS
        ),
        {
            conversationKey:
                getConversationKey(
                    firstUserId,
                    secondUserId
                ),
            participantIds,
            lastMessage: "",
            lastMessageAt:
                serverTimestamp(),
            createdAt:
                serverTimestamp(),
            updatedAt:
                serverTimestamp()
        }
    );

    return {
        id: conversationRef.id,
        conversationKey:
            getConversationKey(
                firstUserId,
                secondUserId
            ),
        participantIds
    };
}
