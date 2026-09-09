import {
    collection,
    doc,
    getDoc,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc
} from "firebase/firestore";

import { db } from "../firebase/index.js";

const RESULT_LIMIT = 50;

function communityCollection(communityId, name) {
    if (!communityId) throw new TypeError("A community ID is required.");
    return collection(db, "communities", communityId, name);
}

function normalizeTag(label) {
    const value = String(label || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
    if (!value || value.length > 30) {
        throw new TypeError("Topic tags must contain 1–30 characters.");
    }
    return value;
}

function safeId(value) {
    return String(value || "item").replace(/[^a-zA-Z0-9_-]/g, "_");
}

export async function createCommunityTopicTag(communityId, actor, label) {
    if (!actor?.id)
        throw new TypeError("An authenticated student is required.");
    const normalizedLabel = normalizeTag(label);
    const reference = doc(
        communityCollection(communityId, "topicTags"),
        safeId(normalizedLabel)
    );
    const existing = await getDoc(reference);
    if (existing.exists()) return false;
    await setDoc(reference, {
        createdAt: serverTimestamp(),
        createdBy: actor.id,
        createdByName:
            String(actor.displayName || "Student")
                .trim()
                .slice(0, 120) || "Student",
        label: normalizedLabel
    });
    return true;
}

export function subscribeCommunityTopicTags(communityId, onData, onError) {
    return onSnapshot(
        query(
            communityCollection(communityId, "topicTags"),
            orderBy("label", "asc"),
            limit(RESULT_LIMIT)
        ),
        (snapshot) =>
            onData(
                snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
            ),
        onError
    );
}

export async function flagQuestionAsDuplicate(communityId, question, actor) {
    if (!actor?.id)
        throw new TypeError("An authenticated student is required.");
    if (!question?.id) throw new TypeError("A question is required.");
    const reference = doc(
        communityCollection(communityId, "curationFlags"),
        safeId(`${question.id}_${actor.id}`)
    );
    const existing = await getDoc(reference);
    if (existing.exists()) return false;
    await setDoc(reference, {
        createdAt: serverTimestamp(),
        createdBy: actor.id,
        createdByName:
            String(actor.displayName || "Student")
                .trim()
                .slice(0, 120) || "Student",
        questionId: question.id,
        questionTitle: String(question.title || "Question").slice(0, 160),
        status: "open",
        type: "possible_duplicate"
    });
    return true;
}

export function subscribeCommunityCurationFlags(communityId, onData, onError) {
    return onSnapshot(
        query(
            communityCollection(communityId, "curationFlags"),
            orderBy("createdAt", "desc"),
            limit(RESULT_LIMIT)
        ),
        (snapshot) =>
            onData(
                snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
            ),
        onError
    );
}
