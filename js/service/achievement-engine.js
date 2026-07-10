import {
    addDoc,
    collection,
    getDocs,
    query,
    serverTimestamp,
    where
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import { db } from "../firebase.js";
import { createNotification } from "./notifications.js";

export async function awardAchievement(userId, achievement) {
    const achievementQuery =
    query(
        collection(db, "achievements"),
        where("userId", "==", userId),
        where("key", "==", achievement.key)
    );

    const snapshot =
    await getDocs(achievementQuery);

    if (!snapshot.empty) {
        return;
    }

    await addDoc(collection(db, "achievements"), {
        userId,
        key: achievement.key,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        earnedAt: serverTimestamp()
    });

    await createNotification({
        userId,
        title: `Achievement unlocked: ${achievement.title}`,
        message: achievement.description,
        type: "achievement"
    });
}
