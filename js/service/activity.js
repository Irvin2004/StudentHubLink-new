import {
    addDoc,
    collection,
    getDocs,
    query,
    serverTimestamp,
    where
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import { db } from "../firebase.js";

const ACTIVITY_COLLECTION = "activities";
const LEGACY_ACTIVITY_COLLECTION = "activity";

function normalizeActivityInput(activityOrUserId, type, title, description, icon = "info") {
    if (typeof activityOrUserId === "object" && activityOrUserId !== null) {
        return {
            icon: "info",
            ...activityOrUserId
        };
    }

    return {
        userId: activityOrUserId,
        type,
        title,
        description,
        icon
    };
}

export async function addActivity({
    userId,
    type,
    title,
    description,
    icon = "info",
    resourceId = "",
    ownerId = "",
    ownerName = ""
}) {
    if (!userId) {
        console.warn("Activity skipped: missing userId.");
        return null;
    }

    try {
        const activityRef = await addDoc(collection(db, ACTIVITY_COLLECTION), {
            userId,
            type,
            title,
            description,
            icon,
            resourceId,
            ownerId,
            ownerName,
            read: false,
            createdAt: serverTimestamp()
        });

        return activityRef.id;
    } catch (error) {
        console.error("Activity error:", error);
        return null;
    }
}

export async function createActivity(activityOrUserId, type, title, description, icon) {
    return addActivity(
        normalizeActivityInput(activityOrUserId, type, title, description, icon)
    );
}

export async function getRecentActivities(userId, activityLimit = 5) {
    if (!userId) {
        return [];
    }

    const activityCollections = [
        ACTIVITY_COLLECTION,
        LEGACY_ACTIVITY_COLLECTION
    ];

    const activityResults = await Promise.all(
        activityCollections.map(async (collectionName) => {
            try {
                const activityQuery = query(
                    collection(db, collectionName),
                    where("userId", "==", userId)
                );

                const snapshot = await getDocs(activityQuery);

                return snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data()
                }));
            } catch (error) {
                console.warn(`Could not load ${collectionName}:`, error);
                return [];
            }
        })
    );

    return activityResults
        .flat()
        .sort((first, second) => {
            const firstTime =
                typeof first.createdAt?.toMillis === "function" ?
                first.createdAt.toMillis() :
                new Date(first.createdAt || 0).getTime();

            const secondTime =
                typeof second.createdAt?.toMillis === "function" ?
                second.createdAt.toMillis() :
                new Date(second.createdAt || 0).getTime();

            return secondTime - firstTime;
        })
        .slice(0, activityLimit);
}
