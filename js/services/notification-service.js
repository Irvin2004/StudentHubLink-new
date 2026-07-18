import {
    addDoc,
    collection,
    doc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import { db } from "../firebase.js";
import { COLLECTIONS } from "../config/firestore.js";

function normalizeNotificationInput(
    notificationOrUserId,
    title,
    message,
    type = "info"
) {
    if (
        typeof notificationOrUserId === "object" &&
        notificationOrUserId !== null
    ) {
        return {
            type: "info",
            ...notificationOrUserId
        };
    }

    return {
        userId: notificationOrUserId,
        title,
        message,
        type
    };
}

export async function createNotification(
    notificationOrUserId,
    title,
    message,
    type
) {
    const notification = normalizeNotificationInput(
        notificationOrUserId,
        title,
        message,
        type
    );

    if (!notification.userId) return null;

    return addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
        userId: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: false,
        createdAt: serverTimestamp()
    });
}

export async function getNotifications(userId) {
    if (!userId) return [];

    const notificationsQuery = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(10)
    );
    const snapshot = await getDocs(notificationsQuery);

    return snapshot.docs.map((notificationDocument) => ({
        id: notificationDocument.id,
        ...notificationDocument.data()
    }));
}

export async function markAsRead(notificationId) {
    if (!notificationId) return;

    await updateDoc(
        doc(db, COLLECTIONS.NOTIFICATIONS, notificationId),
        { read: true }
    );
}
