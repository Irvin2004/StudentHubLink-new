import {
    addDoc,
    collection,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    where
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import { db } from "../firebase.js";
import { COLLECTIONS } from "../config/firestore.js";

export async function sendMessage({
    conversationId,
    senderId,
    receiverId,
    text
}) {
    const message =
    text.trim();

    if (!message) {
        throw new Error(
            "Message cannot be empty."
        );
    }

    await addDoc(
        collection(
            db,
            COLLECTIONS.MESSAGES
        ),
        {
            conversationId,
            senderId,
            receiverId,
            text: message,
            createdAt: serverTimestamp(),
            read: false
        }
    );
}

export function subscribeToMessages(
    conversationId,
    callback
) {
    const messagesQuery = query(
        collection(
            db,
            COLLECTIONS.MESSAGES
        ),
        where(
            "conversationId",
            "==",
            conversationId
        ),
        orderBy(
            "createdAt",
            "asc"
        )
    );

    return onSnapshot(
        messagesQuery,
        (snapshot) => {
            const messages =
            snapshot.docs.map((messageDoc) => ({
                id: messageDoc.id,
                ...messageDoc.data()
            }));

            callback(messages);
        }
    );
}
