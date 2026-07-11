import {
    doc,
    onSnapshot,
    serverTimestamp,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import { db } from "../firebase.js";
import { COLLECTIONS } from "../config/firestore.js";

export async function setTypingStatus(
    conversationId,
    userId,
    isTyping
) {
    await updateDoc(
        doc(
            db,
            COLLECTIONS.CONVERSATIONS,
            conversationId
        ),
        {
            [`typing.${userId}`]: isTyping,
            [`typingUpdatedAt.${userId}`]:
                serverTimestamp()
        }
    );
}

export function subscribeToTypingStatus(
    conversationId,
    currentUserId,
    callback
) {
    return onSnapshot(
        doc(
            db,
            COLLECTIONS.CONVERSATIONS,
            conversationId
        ),
        (snapshot) => {
            if (!snapshot.exists()) {
                callback(false);
                return;
            }

            const typing =
            snapshot.data().typing || {};

            const otherUserTyping =
            Object.entries(typing).some(
                ([userId, value]) =>
                    userId !== currentUserId &&
                    value === true
            );

            callback(otherUserTyping);
        }
    );
}
