import {
    collection,
    doc,
    onSnapshot,
    query,
    serverTimestamp,
    setDoc,
    where
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import { db } from "../firebase.js";
import { COLLECTIONS } from "../config/firestore.js";

export async function setTypingStatus(
    conversationId,
    userId,
    typing
) {
    if (!conversationId || !userId) return;

    await setDoc(
        doc(
            db,
            COLLECTIONS.TYPING_STATUS,
            `${conversationId}_${userId}`
        ),
        {
            conversationId,
            userId,
            typing: typing === true,
            updatedAt: serverTimestamp()
        },
        { merge: true }
    );
}

export function subscribeToTypingStatus(
    conversationId,
    callback,
    onError
) {
    const typingQuery = query(
        collection(db, COLLECTIONS.TYPING_STATUS),
        where("conversationId", "==", conversationId)
    );

    return onSnapshot(
        typingQuery,
        (snapshot) => {
            const statuses = snapshot.docs.map(
                (statusDocument) => ({
                    id: statusDocument.id,
                    ...statusDocument.data()
                })
            );

            callback(statuses);
        },
        (error) => {
            console.error("Typing listener failed:", error);

            if (typeof onError === "function") {
                onError(error);
            }
        }
    );
}
