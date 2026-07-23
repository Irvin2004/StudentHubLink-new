import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp
} from "firebase/firestore";

import { db } from "../../src/firebase/firestore.js";
import { createActivityModel } from "../models/activity.js";

function cleanText(value) {
    return typeof value === "string" ? value.trim() : "";
}

function validateGroupId(groupId) {
    const cleanGroupId = cleanText(groupId);

    if (!cleanGroupId) {
        throw new Error("Group ID is required.");
    }

    return cleanGroupId;
}

function validateActivityId(activityId) {
    const cleanActivityId = cleanText(activityId);

    if (!cleanActivityId) {
        throw new Error("Activity ID is required.");
    }

    return cleanActivityId;
}

function getActivitiesCollection(groupId) {
    return collection(db, "groups", groupId, "activities");
}

function getActivityReference(groupId, activityId) {
    return doc(getActivitiesCollection(groupId), activityId);
}

function mapActivityDocument(activityDocument) {
    return {
        id: activityDocument.id,
        ...activityDocument.data()
    };
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

    if (code === "not-found") {
        const notFoundError = new Error("Activity not found.", {
            cause: error
        });
        notFoundError.code = "not-found";
        return notFoundError;
    }

    return error;
}

async function runFirestoreOperation(operation) {
    try {
        return await operation();
    } catch (error) {
        throw normalizeFirestoreError(error);
    }
}

export async function createActivity(groupId, activity = {}) {
    const cleanGroupId = validateGroupId(groupId);
    const suppliedGroupId = cleanText(activity.groupId);

    if (suppliedGroupId && suppliedGroupId !== cleanGroupId) {
        throw new Error("Activity group ID must match the target group.");
    }

    const activityData = createActivityModel({
        ...activity,
        groupId: cleanGroupId
    });

    return runFirestoreOperation(async () => {
        const activityReference = await addDoc(
            getActivitiesCollection(cleanGroupId),
            {
                ...activityData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            }
        );

        return {
            id: activityReference.id,
            ...activityData,
            createdAt: null,
            updatedAt: null
        };
    });
}

export async function getGroupActivities(groupId) {
    const cleanGroupId = validateGroupId(groupId);

    return runFirestoreOperation(async () => {
        const activitiesQuery = query(
            getActivitiesCollection(cleanGroupId),
            orderBy("createdAt", "desc"),
            limit(100)
        );
        const snapshot = await getDocs(activitiesQuery);

        return snapshot.docs.map(mapActivityDocument);
    });
}

export function subscribeToGroupActivities(
    groupId,
    callback,
    onError = () => {}
) {
    const cleanGroupId = validateGroupId(groupId);

    if (typeof callback !== "function") {
        throw new Error("Activity subscriber is required.");
    }

    const activitiesQuery = query(
        getActivitiesCollection(cleanGroupId),
        orderBy("createdAt", "desc"),
        limit(100)
    );

    return onSnapshot(
        activitiesQuery,
        (snapshot) => {
            callback(snapshot.docs.map(mapActivityDocument));
        },
        (error) => {
            onError(normalizeFirestoreError(error));
        }
    );
}

export async function deleteActivity(groupId, activityId) {
    const cleanGroupId = validateGroupId(groupId);
    const cleanActivityId = validateActivityId(activityId);

    return runFirestoreOperation(async () => {
        const activityReference = getActivityReference(
            cleanGroupId,
            cleanActivityId
        );
        const snapshot = await getDoc(activityReference);

        if (!snapshot.exists()) {
            throw new Error("Activity not found.");
        }

        await deleteDoc(activityReference);
        return true;
    });
}
