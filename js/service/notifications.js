import { db } from "../firebase.js";

import {
    addDoc,
    collection,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

export async function createNotification(userId, title, message) {
    if (!userId) {
        return;
    }

    await addDoc(collection(db, "notifications"), {
        userId,
        title,
        message,
        read: false,
        createdAt: serverTimestamp()
    });
}
