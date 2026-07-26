import {
    collection,
    doc,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc
} from "firebase/firestore";

import { isActivityType } from "../config/activity-types.js";
import { db } from "../firebase/index.js";

const ACTIVITY_LIMIT = 30;

function reference(communityId) {
    if (!communityId) throw new TypeError("A community ID is required.");
    return collection(db, "communities", communityId, "activities");
}

export async function createActivity(communityId, input) {
    if (!isActivityType(input?.type)) {
        throw new TypeError("Unsupported community activity type.");
    }

    const actorId = String(input.actorId || "").trim();
    const actorName = String(input.actorName || "").trim();
    const title = String(input.title || "").trim();
    const description = String(input.description || "").trim();

    if (!actorId || !actorName || !title) {
        throw new TypeError(
            "Activity actor, actor name, and title are required."
        );
    }

    const target = doc(reference(communityId));
    await setDoc(target, {
        ...input,
        actorId,
        actorName,
        title,
        description,
        communityId,
        createdAt: serverTimestamp()
    });
    return target.id;
}

export function listenToActivity(communityId, onData, onError) {
    return onSnapshot(
        query(
            reference(communityId),
            orderBy("createdAt", "desc"),
            limit(ACTIVITY_LIMIT)
        ),
        (snapshot) =>
            onData(
                snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
            ),
        onError
    );
}
