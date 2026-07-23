import {
    collection,
    getDocs,
    limit,
    orderBy,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import { db } from "../firebase/firebase-config.js";
import { createEmptyState } from "../components/empty-state.js";
import { createLeaderboardItem } from "../components/leaderboard-item.js";
import { error as logError } from "../utils/logger.js";
import { showSkeleton } from "../renderers/skeleton-renderer.js";
import { SKELETON_TYPES } from "../config/skeleton-types.js";

async function getTopContributors() {
    const contributorsQuery =
    query(
        collection(db, "users"),
        orderBy("totalUploads", "desc"),
        limit(10)
    );

    const snapshot =
    await getDocs(contributorsQuery);

    return snapshot.docs.map((userDoc) => ({
        id: userDoc.id,
        ...userDoc.data()
    }));
}

async function getTopResources() {
    const resourcesQuery =
    query(
        collection(db, "resources"),
        where("status", "==", "approved"),
        orderBy("downloadCount", "desc"),
        limit(10)
    );

    const snapshot =
    await getDocs(resourcesQuery);

    return snapshot.docs.map((resourceDoc) => ({
        id: resourceDoc.id,
        ...resourceDoc.data()
    }));
}

function renderTopContributors(users) {
    const container =
    document.getElementById("topContributors");

    if (!container) {
        return;
    }

    if (!users.length) {
        container.innerHTML =
        createEmptyState(
            "No contributors yet",
            "Upload resources to appear on the leaderboard.",
            "&#127942;"
        );
        return;
    }

    container.innerHTML =
    users.map((user, index) => {
        const name =
        user.fullName || user.name || user.displayName || "Student";

        return createLeaderboardItem({
            href: `user-profile.html?id=${encodeURIComponent(user.id)}`,
            label: name,
            meta: `${Number(user.totalUploads || 0)} uploads`,
            rank: index + 1
        });
    }).join("");
}

function renderTopResources(resources) {
    const container =
    document.getElementById("topResources");

    if (!container) {
        return;
    }

    if (!resources.length) {
        container.innerHTML =
        createEmptyState(
            "No approved resources yet",
            "Approved resources will appear here after downloads begin.",
            "&#128196;"
        );
        return;
    }

    container.innerHTML =
    resources.map((resource, index) =>
        createLeaderboardItem({
            href: `resource-details.html?id=${encodeURIComponent(resource.id)}`,
            label: resource.title || "Untitled Resource",
            meta: `${Number(resource.downloadCount || 0)} downloads`,
            rank: index + 1
        })
    ).join("");
}

async function loadLeaderboard() {
    showSkeleton(
        document.getElementById("topContributors"),
        SKELETON_TYPES.USER,
        { count: 5 }
    );
    showSkeleton(
        document.getElementById("topResources"),
        SKELETON_TYPES.FILE,
        { count: 5 }
    );

    try {
        const [
            contributors,
            resources
        ] = await Promise.all([
            getTopContributors(),
            getTopResources()
        ]);

        renderTopContributors(contributors);
        renderTopResources(resources);
    } catch (error) {
        logError("FIRESTORE", "Leaderboard failed:", error);
        renderTopContributors([]);
        renderTopResources([]);
    }
}

loadLeaderboard();
