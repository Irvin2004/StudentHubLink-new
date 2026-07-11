import {
    doc,
    increment,
    serverTimestamp,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import { db } from "../firebase.js";
import { addToLibrary } from "./library.js";
import { addActivity } from "./activity.js";
import { awardAchievement } from "./achievement-engine.js";
import { createNotification } from "./notifications.js";
import { DEBUG } from "../config/debug.js";
import { log } from "../utils/logger.js";

export async function processDownload(resource, user) {
    if (!resource || !user) {
        return;
    }

    if (DEBUG.LOG_DOWNLOADS) {
        log("DOWNLOADS", "Processing download", {
            resourceId: resource.id,
            userId: user.uid
        });
    }

    await tryDerivedWrite(
        updateDoc(doc(db, "resources", resource.id), {
            downloadCount: increment(1),
            updatedAt: serverTimestamp()
        }),
        "Resource download count update"
    );

    await addToLibrary(resource, user, "download");

    await addActivity({
        userId: user.uid,
        type: "download",
        title: "Resource downloaded",
        description: resource.title || "A resource was downloaded.",
        icon: "download",
        resourceId: resource.id,
        ownerId: resource.ownerId || "",
        ownerName: resource.ownerName || "Unknown Author"
    });

    await createNotification({
        userId: user.uid,
        title: "Resource added to your library",
        message: `${resource.title || "Resource"} was added to My Library.`,
        type: "download"
    });

    await tryDerivedWrite(
        awardAchievement(user.uid, {
            key: "first-download",
            title: "First Download",
            description: "You downloaded your first study resource.",
            icon: "download"
        }),
        "Achievement award"
    );
}

async function tryDerivedWrite(operation, label) {
    try {
        await operation;
    } catch (error) {
        if (error.code === "permission-denied") {
            console.warn(
                `${label} is blocked by Firestore rules and should move to Cloud Functions.`,
                error
            );
            return;
        }

        throw error;
    }
}
