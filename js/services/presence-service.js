import {
    doc,
    onSnapshot,
    serverTimestamp,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import { db } from "../firebase.js";
import { COLLECTIONS } from "../config/firestore.js";

export async function setUserOnline(userId) {
    if (!userId) return;

    await setDoc(
        doc(db, COLLECTIONS.PRESENCE, userId),
        {
            online: true,
            lastSeen: serverTimestamp()
        },
        { merge: true }
    );
}

export async function setUserOffline(userId) {
    if (!userId) return;

    await setDoc(
        doc(db, COLLECTIONS.PRESENCE, userId),
        {
            online: false,
            lastSeen: serverTimestamp()
        },
        { merge: true }
    );
}

export function subscribeToPresence(
    userId,
    callback,
    onError
) {
    return onSnapshot(
        doc(db, COLLECTIONS.PRESENCE, userId),
        (snapshot) => {
            callback(snapshot.data() || {});
        },
        (error) => {
            console.error("Presence listener failed:", error);

            if (typeof onError === "function") {
                onError(error);
            }
        }
    );
}
