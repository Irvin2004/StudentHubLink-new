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

import { db } from "../firebase/index.js";

function reference(communityId) {
    if (!communityId) throw new TypeError("A community ID is required.");
    return collection(db, "communities", communityId, "activities");
}

export async function createActivity(communityId, input) {
    const target = doc(reference(communityId));
    await setDoc(target, {
        ...input,
        communityId,
        createdAt: serverTimestamp()
    });
    return target.id;
}

export function listenToActivity(communityId, onData, onError) {
    return onSnapshot(
        query(reference(communityId), orderBy("createdAt", "desc"), limit(50)),
        (snapshot) =>
            onData(
                snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
            ),
        onError
    );
}
