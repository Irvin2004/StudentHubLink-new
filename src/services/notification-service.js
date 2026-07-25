import {
    collection,
    doc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
    writeBatch
} from "firebase/firestore";

import { db } from "../firebase/index.js";
import { createNotificationModel } from "../models/notification.js";

function notificationsReference(userId) {
    if (!userId) throw new TypeError("A user ID is required.");
    return collection(db, "users", userId, "notifications");
}

export function listenToNotifications(userId, onData, onError) {
    const notificationsQuery = query(
        notificationsReference(userId),
        orderBy("createdAt", "desc"),
        limit(100)
    );
    return onSnapshot(
        notificationsQuery,
        (snapshot) =>
            onData(
                snapshot.docs.map((item) =>
                    createNotificationModel({ id: item.id, ...item.data() })
                )
            ),
        onError
    );
}

export async function markNotification(userId, notificationId, read = true) {
    await updateDoc(doc(notificationsReference(userId), notificationId), {
        read,
        updatedAt: serverTimestamp()
    });
}

export async function markAllNotificationsRead(userId) {
    const snapshot = await getDocs(
        query(notificationsReference(userId), where("read", "==", false))
    );
    const batch = writeBatch(db);
    snapshot.docs.forEach((item) =>
        batch.update(item.ref, {
            read: true,
            updatedAt: serverTimestamp()
        })
    );
    await batch.commit();
}

export async function createNotification(recipientId, input) {
    const reference = doc(notificationsReference(recipientId));
    await setDoc(reference, {
        ...input,
        recipientId,
        read: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    return reference.id;
}
