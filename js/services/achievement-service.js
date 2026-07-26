import {
    addDoc,
    collection,
    getDocs,
    query,
    serverTimestamp,
    where
} from "firebase/firestore";

import { db } from "../../src/firebase/firestore.js";
import { createNotification } from "./notification-service.js";

export async function awardAchievement(userId, achievement) {
    const achievementQuery = query(
        collection(db, "achievements"),
        where("userId", "==", userId),
        where("key", "==", achievement.key)
    );

    const snapshot = await getDocs(achievementQuery);

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
