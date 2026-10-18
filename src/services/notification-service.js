import {
    collection,
    documentId,
    doc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    runTransaction,
    serverTimestamp,
    startAfter,
    updateDoc,
    where,
    writeBatch
} from "firebase/firestore";

import { db } from "../firebase/index.js";
import { createNotificationModel } from "../models/notification.js";

const NOTIFICATION_PAGE_SIZE = 50;

function notificationsReference(userId) {
    if (!userId) throw new TypeError("A user ID is required.");
    return collection(db, "users", userId, "notifications");
}

function latestNotificationsQuery(userId) {
    return query(
        notificationsReference(userId),
        orderBy("createdAt", "desc"),
        orderBy(documentId(), "desc"),
        limit(50)
    );
}

function olderNotificationsQuery(userId, cursor) {
    return query(
        notificationsReference(userId),
        orderBy("createdAt", "desc"),
        orderBy(documentId(), "desc"),
        startAfter(cursor),
        limit(NOTIFICATION_PAGE_SIZE)
    );
}

function mapNotifications(snapshot) {
    return snapshot.docs.map((item) =>
        createNotificationModel({ id: item.id, ...item.data() })
    );
}

function pageFromSnapshot(snapshot) {
    return {
        cursor: snapshot.docs.at(-1) || null,
        hasMore: snapshot.docs.length === NOTIFICATION_PAGE_SIZE,
        notifications: mapNotifications(snapshot)
    };
}

export function listenToNotifications(userId, onData, onError) {
    const notificationsQuery = latestNotificationsQuery(userId);
    return onSnapshot(
        notificationsQuery,
        (snapshot) => {
            const page = pageFromSnapshot(snapshot);
            onData(page.notifications, {
                cursor: page.cursor,
                hasMore: page.hasMore
            });
        },
        onError
    );
}

export async function loadOlderNotifications(userId, cursor) {
    if (!cursor) {
        throw new TypeError("A notification page cursor is required.");
    }

    const snapshot = await getDocs(olderNotificationsQuery(userId, cursor));
    return pageFromSnapshot(snapshot);
}

function createdAtValue(value) {
    if (typeof value?.toMillis === "function") return value.toMillis();
    if (value instanceof Date) return value.getTime();
    return Number.isFinite(value) ? value : 0;
}

function compareNotifications(left, right) {
    const timestampDifference =
        createdAtValue(right.createdAt) - createdAtValue(left.createdAt);
    if (timestampDifference !== 0) return timestampDifference;
    return String(right.id).localeCompare(String(left.id));
}

export function mergeNotificationPages(current = [], incoming = []) {
    const notificationsById = new Map();

    incoming.forEach((notification) =>
        notificationsById.set(notification.id, notification)
    );
    // Current items win so an optimistic read state is retained until the
    // live listener confirms the server value.
    current.forEach((notification) =>
        notificationsById.set(notification.id, notification)
    );

    return [...notificationsById.values()].sort(compareNotifications);
}

export async function markNotification(userId, notificationId, read = true) {
    await updateDoc(doc(notificationsReference(userId), notificationId), {
        read,
        updatedAt: serverTimestamp()
    });
}

export async function markAllNotificationsRead(userId) {
    const snapshot = await getDocs(
        query(
            notificationsReference(userId),
            where("read", "==", false),
            limit(500)
        )
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
    const eventId = normalizeEventId(input?.eventId);
    const { eventId: _eventId, ...notification } = input || {};
    const reference = eventId
        ? doc(notificationsReference(recipientId), eventId)
        : doc(notificationsReference(recipientId));

    await runTransaction(db, async (transaction) => {
        const existing = await transaction.get(reference);

        // An event-keyed notification may already have been marked read. Do
        // not write it again: retries must preserve recipient-owned state.
        if (existing.exists()) return;

        transaction.set(reference, {
            ...notification,
            recipientId,
            read: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    });
    return reference.id;
}

function normalizeEventId(eventId) {
    if (eventId === undefined || eventId === null || eventId === "") {
        return "";
    }

    if (typeof eventId !== "string" || !eventId.trim()) {
        throw new TypeError("Notification event ID must be non-empty text.");
    }

    const cleanEventId = eventId.trim();
    if (cleanEventId.includes("/")) {
        throw new TypeError("Notification event ID cannot contain '/'.");
    }

    return cleanEventId;
}
