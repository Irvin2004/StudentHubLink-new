import {
    collectionGroup,
    doc,
    getDoc,
    onSnapshot,
    query,
    serverTimestamp,
    setDoc,
    where
} from "firebase/firestore";

import { COLLECTIONS } from "../config/firestore.js";
import { PRESENCE_STATUS } from "../config/presence-status.js";
import { db } from "../../src/firebase/firestore.js";
import { createPresenceModel } from "../models/presence.js";
import { error as logError } from "../utils/logger.js";

const TYPING_TIMEOUT = 2000;
const typingSessions = new Map();

function cleanText(value) {
    return typeof value === "string" ? value.trim() : "";
}

function validateUserId(userId) {
    const cleanUserId = cleanText(userId);

    if (!cleanUserId) {
        throw new Error("User ID is required.");
    }

    return cleanUserId;
}

function validateConversationId(conversationId) {
    const cleanConversationId = cleanText(conversationId);

    if (!cleanConversationId) {
        throw new Error("Conversation ID is required.");
    }

    return cleanConversationId;
}

function getPresenceReference(userId) {
    return doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.PRESENCE, "status");
}

function normalizeFirestoreError(error) {
    const code = String(error?.code || "").replace(/^firestore\//, "");

    if (code === "permission-denied") {
        const permissionError = new Error("Permission denied.", {
            cause: error
        });
        permissionError.code = "permission-denied";
        return permissionError;
    }

    return error;
}

function clearTypingTimer(userId) {
    const session = typingSessions.get(userId);

    if (session?.timer) {
        clearTimeout(session.timer);
    }

    typingSessions.delete(userId);
}

function restartTypingTimer(userId, session) {
    if (session.timer) {
        clearTimeout(session.timer);
    }

    session.timer = setTimeout(() => {
        stopTyping(userId).catch((error) => {
            logError("PRESENCE", "Automatic typing reset failed:", error);
        });
    }, TYPING_TIMEOUT);
}

function mapPresence(userId, data = {}) {
    return createPresenceModel({
        userId,
        userName: data.userName,
        status: data.status || PRESENCE_STATUS.OFFLINE,
        conversationId: data.conversationId,
        lastSeen: data.lastSeen || null,
        updatedAt: data.updatedAt || null
    });
}

async function writePresence(userId, presence) {
    try {
        await setDoc(getPresenceReference(userId), presence, { merge: true });
    } catch (error) {
        throw normalizeFirestoreError(error);
    }
}

async function writePresenceWithInitialLastSeen(userId, presence) {
    const reference = getPresenceReference(userId);
    let snapshot;

    try {
        snapshot = await getDoc(reference);
    } catch (error) {
        throw normalizeFirestoreError(error);
    }

    await writePresence(userId, {
        ...presence,
        ...(!snapshot.exists() || !("lastSeen" in snapshot.data())
            ? { lastSeen: null }
            : {})
    });
}

export async function setUserOnline(userId) {
    const cleanUserId = validateUserId(userId);
    clearTypingTimer(cleanUserId);

    const reference = getPresenceReference(cleanUserId);
    let snapshot;

    try {
        snapshot = await getDoc(reference);
    } catch (error) {
        throw normalizeFirestoreError(error);
    }

    const updates = {
        status: PRESENCE_STATUS.ONLINE,
        conversationId: "",
        updatedAt: serverTimestamp()
    };

    if (!snapshot.exists() || !("lastSeen" in snapshot.data())) {
        updates.lastSeen = null;
    }

    await writePresence(cleanUserId, updates);
    return mapPresence(cleanUserId, {
        ...snapshot.data(),
        ...updates,
        updatedAt: null
    });
}

export async function setUserOffline(userId) {
    const cleanUserId = validateUserId(userId);
    clearTypingTimer(cleanUserId);

    await writePresence(cleanUserId, {
        status: PRESENCE_STATUS.OFFLINE,
        conversationId: "",
        lastSeen: serverTimestamp(),
        updatedAt: serverTimestamp()
    });

    return mapPresence(cleanUserId, {
        status: PRESENCE_STATUS.OFFLINE
    });
}

export async function setUserTyping(userId, conversationId, userName = "") {
    const cleanUserId = validateUserId(userId);
    const cleanConversationId = validateConversationId(conversationId);
    const existingSession = typingSessions.get(cleanUserId);

    if (existingSession?.conversationId === cleanConversationId) {
        restartTypingTimer(cleanUserId, existingSession);
        return existingSession.writePromise;
    }

    clearTypingTimer(cleanUserId);

    const presence = createPresenceModel({
        userId: cleanUserId,
        userName,
        status: PRESENCE_STATUS.TYPING,
        conversationId: cleanConversationId
    });
    const updates = {
        status: presence.status,
        conversationId: presence.conversationId,
        updatedAt: serverTimestamp()
    };

    if (presence.userName) {
        updates.userName = presence.userName;
    }

    const writePromise = writePresenceWithInitialLastSeen(
        cleanUserId,
        updates
    ).then(() => presence);
    const session = {
        conversationId: cleanConversationId,
        timer: null,
        writePromise
    };

    typingSessions.set(cleanUserId, session);
    restartTypingTimer(cleanUserId, session);

    try {
        return await session.writePromise;
    } catch (error) {
        if (typingSessions.get(cleanUserId) === session) {
            clearTypingTimer(cleanUserId);
        }
        throw error;
    }
}

export async function stopTyping(userId) {
    const cleanUserId = validateUserId(userId);
    clearTypingTimer(cleanUserId);

    await writePresenceWithInitialLastSeen(cleanUserId, {
        status: PRESENCE_STATUS.ONLINE,
        conversationId: "",
        updatedAt: serverTimestamp()
    });

    return mapPresence(cleanUserId, {
        status: PRESENCE_STATUS.ONLINE
    });
}

export async function getPresence(userId) {
    const cleanUserId = validateUserId(userId);

    try {
        const snapshot = await getDoc(getPresenceReference(cleanUserId));

        return mapPresence(
            cleanUserId,
            snapshot.exists() ? snapshot.data() : {}
        );
    } catch (error) {
        throw normalizeFirestoreError(error);
    }
}

export function subscribeToPresence(userId, callback, onError = () => {}) {
    const cleanUserId = validateUserId(userId);

    if (typeof callback !== "function") {
        throw new Error("Presence subscriber is required.");
    }

    return onSnapshot(
        getPresenceReference(cleanUserId),
        (snapshot) => {
            callback(
                mapPresence(
                    cleanUserId,
                    snapshot.exists() ? snapshot.data() : {}
                )
            );
        },
        (error) => onError(normalizeFirestoreError(error))
    );
}

/* Compatibility adapters for the current chat controller. */
export async function setTypingStatus(
    conversationId,
    userId,
    typing,
    displayName = ""
) {
    if (typing === true) {
        return setUserTyping(userId, conversationId, displayName);
    }

    return stopTyping(userId);
}

export function subscribeToTypingStatus(
    conversationId,
    callback,
    onError = () => {}
) {
    const cleanConversationId = validateConversationId(conversationId);

    if (typeof callback !== "function") {
        throw new Error("Typing subscriber is required.");
    }

    const typingQuery = query(
        collectionGroup(db, COLLECTIONS.PRESENCE),
        where("status", "==", PRESENCE_STATUS.TYPING),
        where("conversationId", "==", cleanConversationId)
    );

    return onSnapshot(
        typingQuery,
        (snapshot) => {
            callback(
                snapshot.docs.map((presenceDocument) => {
                    const userId = presenceDocument.ref.parent.parent?.id || "";
                    const presence = mapPresence(
                        userId,
                        presenceDocument.data()
                    );

                    return {
                        id: userId,
                        userId,
                        displayName: presence.userName || "Student",
                        conversationId: presence.conversationId,
                        typing: true,
                        updatedAt: presence.updatedAt
                    };
                })
            );
        },
        (error) => onError(normalizeFirestoreError(error))
    );
}
