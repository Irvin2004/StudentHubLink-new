import {
    collection,
    documentId,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

import { auth, db } from "../firebase.js";
import { createEmptyState } from "../components/empty-state.js";
import { createResourceCard } from "../components/resource-card.js";
import { COLLECTIONS } from "../config/firestore.js";
import { getFavoriteIds } from "../services/favorites-service.js";
import { initializeFavoriteButtons } from "../controllers/favorites-controller.js";
import { showSkeleton } from "../utils/loading.js";
import { handleError } from "../utils/error-handler.js";

const FIRESTORE_IN_LIMIT =
10;

function chunkIds(ids) {
    const chunks =
    [];

    for (let index = 0; index < ids.length; index += FIRESTORE_IN_LIMIT) {
        chunks.push(ids.slice(index, index + FIRESTORE_IN_LIMIT));
    }

    return chunks;
}

async function getFavoriteResources(favoriteIds) {
    const resourceBatches =
    await Promise.all(
        chunkIds(favoriteIds).map(async (ids) => {
            const favoritesQuery =
            query(
                collection(db, COLLECTIONS.RESOURCES),
                where(documentId(), "in", ids)
            );

            const snapshot =
            await getDocs(favoritesQuery);

            return snapshot.docs.map((resourceDoc) => ({
                id: resourceDoc.id,
                ...resourceDoc.data()
            }));
        })
    );

    const resources =
    resourceBatches.flat();

    return favoriteIds
        .map((favoriteId) =>
            resources.find((resource) => resource.id === favoriteId)
        )
        .filter(Boolean);
}

async function renderFavorites(favoriteIds) {
    const grid =
    document.getElementById("favoritesGrid");

    if (!grid) {
        return;
    }

    if (!favoriteIds.length) {
        grid.innerHTML =
        createEmptyState(
            "No favorites yet",
            "Save resources to see them here.",
        );
        return;
    }

    const resources =
    await getFavoriteResources(favoriteIds);

    if (!resources.length) {
        grid.innerHTML =
        createEmptyState(
            "No favorites found",
            "Saved resources may no longer be available.",
        );
        return;
    }

    grid.innerHTML =
    resources
        .map((resource) =>
            createResourceCard(resource, {
                isFavorite: true,
                showFavorite: true
            })
        )
        .join("");
}

initializeFavoriteButtons();

onAuthStateChanged(auth, async (user) => {
    const grid =
    document.getElementById("favoritesGrid");

    if (!user) {
        window.location.href =
        "../login.html";
        return;
    }

    try {
        showSkeleton("favoritesGrid");

        const favoriteIds =
        await getFavoriteIds(user.uid);

        await renderFavorites(favoriteIds);
    } catch (error) {
        handleError(error, "Unable to load favorites.");

        if (grid) {
            grid.innerHTML =
            createEmptyState(
                "Could not load favorites",
                "Please try again.",
                "&#9888;"
            );
        }
    }
});
