import { collection, getDocs, query, where } from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../../src/firebase/auth.js";
import { db } from "../../src/firebase/firestore.js";
import { createAchievementCard } from "../components/achievement-card.js";
import { createEmptyState } from "../components/empty-state.js";
import { getTimestampMillis } from "../utils/format-date.js";

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "../login.html";
        return;
    }

    const achievementsQuery = query(
        collection(db, "achievements"),
        where("userId", "==", user.uid)
    );

    const snapshot = await getDocs(achievementsQuery);

    const achievements = snapshot.docs
        .map((achievementDoc) => ({
            id: achievementDoc.id,
            ...achievementDoc.data()
        }))
        .sort(
            (firstAchievement, secondAchievement) =>
                getTimestampMillis(secondAchievement.earnedAt) -
                getTimestampMillis(firstAchievement.earnedAt)
        );

    renderAchievements(achievements);
});

function renderAchievements(achievements) {
    const grid = document.getElementById("achievementGrid");

    if (!grid) {
        return;
    }

    if (!achievements.length) {
        grid.innerHTML = createEmptyState(
            "No achievements yet",
            "Start using StudentHub to unlock achievements.",
            "&#127942;"
        );

        return;
    }

    grid.innerHTML = achievements.map(createAchievementCard).join("");
}
