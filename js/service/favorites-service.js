import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    serverTimestamp,
    where
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import { db } from "../firebase.js";
import { COLLECTIONS } from "../config/firestore.js";

export async function getFavoriteRecord(userId, resourceId) {
    const favoritesQuery =
    query(
        collection(db, COLLECTIONS.FAVORITES),
        where("userId", "==", userId),
        where("resourceId", "==", resourceId)
    );

    const snapshot =
    await getDocs(favoritesQuery);

    if (snapshot.empty) {
        return null;
    }

    const favoriteDoc =
    snapshot.docs[0];

    return {
        id: favoriteDoc.id,
        ...favoriteDoc.data()
    };
}

export async function isFavorite(userId, resourceId) {
    const favorite =
    await getFavoriteRecord(userId, resourceId);

    return Boolean(favorite);
}

export async function addFavorite(userId, resourceId) {
    const existingFavorite =
    await getFavoriteRecord(userId, resourceId);

    if (existingFavorite) {
        return existingFavorite;
    }

    const favoriteRef =
    await addDoc(
        collection(db, COLLECTIONS.FAVORITES),
        {
            userId,
            resourceId,
            createdAt: serverTimestamp()
        }
    );

    return {
        id: favoriteRef.id,
        userId,
        resourceId
    };
}

export async function removeFavorite(userId, resourceId) {
    const favorite =
    await getFavoriteRecord(userId, resourceId);

    if (!favorite) {
        return false;
    }

    await deleteDoc(
        doc(db, COLLECTIONS.FAVORITES, favorite.id)
    );

    return true;
}

export async function toggleFavorite(userId, resourceId) {
    const favorite =
    await getFavoriteRecord(userId, resourceId);

    if (favorite) {
        await deleteDoc(
            doc(db, COLLECTIONS.FAVORITES, favorite.id)
        );

        return {
            isFavorite: false,
            message: "Removed from favorites."
        };
    }

    await addFavorite(userId, resourceId);

    return {
        isFavorite: true,
        message: "Added to favorites."
    };
}

export async function getFavoriteIds(userId) {
    const favoritesQuery =
    query(
        collection(db, COLLECTIONS.FAVORITES),
        where("userId", "==", userId)
    );

    const snapshot =
    await getDocs(favoritesQuery);

    return snapshot.docs.map((favoriteDoc) =>
        favoriteDoc.data().resourceId
    );
}
