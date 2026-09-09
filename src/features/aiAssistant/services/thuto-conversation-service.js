import {
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc
} from "firebase/firestore";

import { db } from "../../../firebase/index.js";

const MESSAGE_LIMIT = 100;
const MESSAGE_ROLES = new Set(["assistant", "user"]);

function requireText(value, label) {
    const text = String(value || "").trim();
    if (!text) throw new TypeError(`${label} is required.`);
    return text;
}

function conversationReference(userId, resourceId) {
    return doc(
        db,
        "users",
        requireText(userId, "A user ID"),
        "thutoConversations",
        encodeURIComponent(requireText(resourceId, "A resource ID"))
    );
}

function messagesReference(userId, resourceId) {
    return collection(conversationReference(userId, resourceId), "messages");
}

function createThreadId() {
    return (
        globalThis.crypto?.randomUUID?.() ||
        `${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
}

function normalizeTimestamp(value) {
    if (typeof value?.toDate === "function") return value.toDate();
    return value instanceof Date ? value : null;
}

async function ensureConversation(userId, resource) {
    const resourceId = requireText(resource?.id, "A resource ID");
    const reference = conversationReference(userId, resourceId);
    const snapshot = await getDoc(reference);

    if (snapshot.exists()) {
        return {
            reference,
            threadId: requireText(
                snapshot.data().activeThreadId,
                "An active thread ID"
            )
        };
    }

    const threadId = createThreadId();
    const timestamp = serverTimestamp();
    await setDoc(reference, {
        activeThreadId: threadId,
        createdAt: timestamp,
        resourceId,
        sourceTitle: requireText(resource?.title, "A resource title"),
        updatedAt: timestamp,
        userId: requireText(userId, "A user ID")
    });
    return { reference, threadId };
}

export async function loadThutoConversation(userId, resource) {
    const { threadId } = await ensureConversation(userId, resource);
    const snapshot = await getDocs(
        query(
            messagesReference(userId, resource.id),
            orderBy("createdAt", "desc"),
            limit(MESSAGE_LIMIT)
        )
    );
    const messages = snapshot.docs
        .map((messageDocument) => ({
            id: messageDocument.id,
            ...messageDocument.data(),
            createdAt: normalizeTimestamp(messageDocument.data().createdAt)
        }))
        .filter((message) => message.threadId === threadId)
        .reverse();

    return { messages, threadId };
}

export async function addThutoMessage(
    userId,
    resource,
    threadId,
    { content, role }
) {
    const cleanRole = requireText(role, "A message role");
    if (!MESSAGE_ROLES.has(cleanRole)) {
        throw new TypeError("A Thuto message role must be user or assistant.");
    }
    const cleanContent = requireText(content, "Message content");
    const activeThreadId = requireText(threadId, "A thread ID");
    const { reference } = await ensureConversation(userId, resource);
    const messageReference = doc(messagesReference(userId, resource.id));
    const timestamp = serverTimestamp();
    const message = {
        content: cleanContent,
        createdAt: timestamp,
        role: cleanRole,
        threadId: activeThreadId
    };

    await setDoc(messageReference, message);
    await updateDoc(reference, {
        sourceTitle: requireText(resource.title, "A resource title"),
        updatedAt: timestamp
    });

    return {
        ...message,
        createdAt: new Date(),
        id: messageReference.id
    };
}

export async function startNewThutoConversation(userId, resource) {
    const { reference } = await ensureConversation(userId, resource);
    const threadId = createThreadId();
    await updateDoc(reference, {
        activeThreadId: threadId,
        sourceTitle: requireText(resource.title, "A resource title"),
        updatedAt: serverTimestamp()
    });
    return { messages: [], threadId };
}
