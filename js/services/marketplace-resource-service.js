import {
    doc,
    getDoc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import { db } from "../firebase/firebase-config.js";
import { COLLECTIONS } from "../config/firestore.js";

function mapResource(snapshot) {
    return snapshot.exists()
        ? { id: snapshot.id, ...snapshot.data() }
        : null;
}

export async function getMarketplaceResource(resourceId) {
    if (!resourceId?.trim()) throw new Error("Resource ID is required.");
    return mapResource(await getDoc(
        doc(db, COLLECTIONS.RESOURCES, resourceId.trim())
    ));
}

export function subscribeToMarketplaceResource(
    resourceId,
    onResource,
    onError = () => {}
) {
    if (!resourceId?.trim()) throw new Error("Resource ID is required.");
    if (typeof onResource !== "function") {
        throw new Error("Resource subscriber is required.");
    }

    return onSnapshot(
        doc(db, COLLECTIONS.RESOURCES, resourceId.trim()),
        (snapshot) => onResource(mapResource(snapshot)),
        onError
    );
}
