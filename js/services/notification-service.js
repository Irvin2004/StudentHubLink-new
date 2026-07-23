import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where,
    writeBatch
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import { db } from "../firebase/firebase-config.js";
import { COLLECTIONS } from "../config/firestore.js";
import { createNotificationModel } from "../models/notification.js";

function cleanText(value) {
    return typeof value === "string"
        ? value.trim()
        : "";
}

function validateUserId(userId) {
    const cleanUserId = cleanText(userId);

    if (!cleanUserId) {
        throw new Error("User ID is required.");
    }

    return cleanUserId;
}

function validateNotificationId(notificationId) {
    const cleanNotificationId = cleanText(notificationId);

    if (!cleanNotificationId) {
        throw new Error("Notification ID is required.");
    }

    return cleanNotificationId;
}

function getNotificationsCollection(userId) {
    return collection(
        db,
        COLLECTIONS.USERS,
        userId,
        COLLECTIONS.NOTIFICATIONS
    );
}

function getNotificationReference(userId, notificationId) {
    return doc(
        getNotificationsCollection(userId),
        notificationId
    );
}

function mapNotificationDocument(notificationDocument) {
    return {
        id: notificationDocument.id,
        ...notificationDocument.data()
    };
}

function normalizeFirestoreError(error) {
    const code = String(error?.code || "")
        .replace(/^firestore\//, "");

    if (code === "permission-denied") {
        const permissionError = new Error("Permission denied.", {
            cause: error
        });
        permissionError.code = "permission-denied";
        return permissionError;
    }

    if (code === "not-found") {
        const notFoundError = new Error("Notification not found.", {
            cause: error
        });
        notFoundError.code = "not-found";
        return notFoundError;
    }

    return error;
}

async function runFirestoreOperation(operation) {
    try {
        return await operation();
    } catch (error) {
        throw normalizeFirestoreError(error);
    }
}

export async function createNotification(notificationData = {}) {
    const notification = createNotificationModel(notificationData);
    const userId = validateUserId(notification.recipientId);

    return runFirestoreOperation(async () => {
        const notificationReference = await addDoc(
            getNotificationsCollection(userId),
            {
                ...notification,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            }
        );

        return {
            id: notificationReference.id,
            ...notification,
            createdAt: null,
            updatedAt: null
        };
    });
}

export async function getNotifications(userId) {
    const cleanUserId = validateUserId(userId);

    return runFirestoreOperation(async () => {
        const notificationsQuery = query(
            getNotificationsCollection(cleanUserId),
            orderBy("createdAt", "desc"),
            limit(100)
        );
        const snapshot = await getDocs(notificationsQuery);

        return snapshot.docs.map(mapNotificationDocument);
    });
}

export async function getNotification(userId, notificationId) {
    const cleanUserId = validateUserId(userId);
    const cleanNotificationId = validateNotificationId(notificationId);

    return runFirestoreOperation(async () => {
        const snapshot = await getDoc(
            getNotificationReference(
                cleanUserId,
                cleanNotificationId
            )
        );

        if (!snapshot.exists()) {
            throw new Error("Notification not found.");
        }

        return mapNotificationDocument(snapshot);
    });
}

export async function markAsRead(userId, notificationId) {
    const cleanUserId = validateUserId(userId);
    const cleanNotificationId = validateNotificationId(notificationId);

    return runFirestoreOperation(async () => {
        const notificationReference = getNotificationReference(
            cleanUserId,
            cleanNotificationId
        );
        const existingNotification = await getDoc(notificationReference);

        if (!existingNotification.exists()) {
            throw new Error("Notification not found.");
        }

        await updateDoc(notificationReference, {
            read: true,
            updatedAt: serverTimestamp()
        });

        const updatedNotification = await getDoc(notificationReference);
        return mapNotificationDocument(updatedNotification);
    });
}

export async function markAllAsRead(userId) {
    const cleanUserId = validateUserId(userId);

    return runFirestoreOperation(async () => {
        const unreadNotificationsQuery = query(
            getNotificationsCollection(cleanUserId),
            where("read", "==", false)
        );
        const snapshot = await getDocs(unreadNotificationsQuery);

        for (let index = 0; index < snapshot.docs.length; index += 500) {
            const batch = writeBatch(db);

            snapshot.docs
                .slice(index, index + 500)
                .forEach((notificationDocument) => {
                    batch.update(notificationDocument.ref, {
                        read: true,
                        updatedAt: serverTimestamp()
                    });
                });

            await batch.commit();
        }

        return snapshot.docs.length;
    });
}

export async function deleteNotification(userId, notificationId) {
    const cleanUserId = validateUserId(userId);
    const cleanNotificationId = validateNotificationId(notificationId);

    await runFirestoreOperation(async () => {
        const notificationReference = getNotificationReference(
            cleanUserId,
            cleanNotificationId
        );
        const existingNotification = await getDoc(notificationReference);

        if (!existingNotification.exists()) {
            throw new Error("Notification not found.");
        }

        await deleteDoc(notificationReference);
    });
}

export function subscribeToNotifications(
    userId,
    onNotifications,
    onError = () => {}
) {
    const cleanUserId = validateUserId(userId);

    if (typeof onNotifications !== "function") {
        throw new Error("Notification subscriber is required.");
    }

    const notificationsQuery = query(
        getNotificationsCollection(cleanUserId),
        orderBy("createdAt", "desc"),
        limit(100)
    );

    return onSnapshot(
        notificationsQuery,
        (snapshot) => {
            onNotifications(
                snapshot.docs.map(mapNotificationDocument)
            );
        },
        (error) => {
            onError(normalizeFirestoreError(error));
        }
    );
}
