import {
    collection,
    getDocs,
    limit,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import { db } from "../firebase.js";

export async function getRelatedResources(resource) {
    if (!resource?.category) {
        return [];
    }

    const relatedResourcesQuery =
    query(
        collection(db, "resources"),
        where("status", "==", "approved"),
        where("category", "==", resource.category),
        limit(6)
    );

    const snapshot =
    await getDocs(relatedResourcesQuery);

    return snapshot.docs
        .map((resourceDoc) => ({
            id: resourceDoc.id,
            ...resourceDoc.data()
        }))
        .filter((item) => item.id !== resource.id);
}
