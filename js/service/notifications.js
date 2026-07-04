import { db } from "../firebase.js";

import {
    addDoc,
    collection,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where,
    doc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

function normalizeNotificationInput(notificationOrUserId, title, message, type = "info") {
    if (typeof notificationOrUserId === "object" && notificationOrUserId !== null) {
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

export async function createNotification(notificationOrUserId, title, message, type) {
    const notification =
    normalizeNotificationInput(notificationOrUserId, title, message, type);

    if (!notification.userId) {
        return null;
    }

    return addDoc(collection(db, "notifications"), {
        userId: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: false,
        createdAt: serverTimestamp()
    });
}

export async function getNotifications(userId) {
    if (!userId) {
        return [];
    }

    const notificationsQuery =
    query(
        collection(db, "notifications"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(10)
    );

    const snapshot =
    await getDocs(notificationsQuery);

    return snapshot.docs.map((notificationDoc) => ({
        id: notificationDoc.id,
        ...notificationDoc.data()
    }));
}

export async function markAsRead(notificationId) {
    if (!notificationId) {
        return;
    }

    await updateDoc(doc(db, "notifications", notificationId), {
        read: true
    });
}
