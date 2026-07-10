import {
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

import { auth, db } from "../firebase.js";
import { createAchievementCard } from "../components/achievement-card.js";
import { createEmptyState } from "../components/empty-state.js";
import { getTimestampMillis } from "../utils/formatDate.js";

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "../login.html";
        return;
    }

    const achievementsQuery =
    query(
        collection(db, "achievements"),
        where("userId", "==", user.uid)
    );

    const snapshot =
    await getDocs(achievementsQuery);

    const achievements =
    snapshot.docs
        .map((achievementDoc) => ({
            id: achievementDoc.id,
            ...achievementDoc.data()
        }))
        .sort((firstAchievement, secondAchievement) =>
            getTimestampMillis(secondAchievement.earnedAt) -
            getTimestampMillis(firstAchievement.earnedAt)
        );

    renderAchievements(achievements);
});

function renderAchievements(achievements) {
    const grid =
    document.getElementById("achievementGrid");

    if (!grid) {
        return;
    }

    if (!achievements.length) {
        grid.innerHTML =
        createEmptyState(
            "No achievements yet",
            "Start using StudentHub to unlock achievements.",
            "&#127942;"
        );

        return;
    }

    grid.innerHTML =
    achievements.map(createAchievementCard).join("");
}
