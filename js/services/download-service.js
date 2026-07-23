import {
    doc,
    increment,
    serverTimestamp,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import { db } from "../firebase/firebase-config.js";
import { addToLibrary } from "../pages/library-page.js";
import { awardAchievement } from "./achievement-service.js";
import { createNotification } from "./notification-service.js";
import { DEBUG } from "../config/debug.js";
import { log } from "../utils/logger.js";
import { logError } from "./error-service.js";

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
            logError(
                error,
                `${label} is blocked by Firestore rules and should move to Cloud Functions.`
            );
            return;
        }

        throw error;
    }
}
