import {
    addDoc,
    collection,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "../firebase.js";

export async function addActivity({
    userId,
    type,
    title,
    description,
    icon = "info"
}) {
    try {
        await addDoc(collection(db, "activities"), {
            userId,
            type,
            title,
            description,
            icon,
            read: false,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Activity error:", error);
    }
}

export async function getRecentActivities(userId, activityLimit = 5) {
    const q = query(
        collection(db, "activities"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(activityLimit)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    }));
}
