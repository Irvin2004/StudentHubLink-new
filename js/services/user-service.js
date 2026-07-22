import {
    collection,
    getDocs,
    limit,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import { COLLECTIONS } from "../config/firestore.js";
import { db } from "../firebase.js";

export async function getUsers() {
    const publicUsersQuery = query(
        collection(db, COLLECTIONS.USERS),
        where("profileVisibility", "==", "public"),
        limit(100)
    );
    const snapshot = await getDocs(publicUsersQuery);

    return snapshot.docs.map((userDocument) => ({
        id: userDocument.id,
        ...userDocument.data()
    }));
}
