import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { db } from "../firebase/index.js";
import { createUserProfile } from "../models/user-profile.js";

/**
 * Creates the Firestore profile for a newly authenticated user.
 *
 * @param {import("firebase/auth").User} user
 * @param {{fullName?: string, photoURL?: string|null}} [data]
 * @returns {Promise<object>}
 */
export async function createUserProfileDocument(user, data = {}) {
    const profile = createUserProfile(user, data);

    await setDoc(doc(db, "users", user.uid), {
        ...profile,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
    });

    return profile;
}

/**
 * Updates mutable fields in an existing Firestore user profile.
 *
 * @param {string} userId
 * @param {{displayName?: string, photoURL?: string|null}} data
 * @returns {Promise<object>}
 */
export async function updateUserProfileDocument(userId, data = {}) {
    if (!userId) {
        throw new TypeError("A user ID is required.");
    }

    const updates = {};

    if (Object.hasOwn(data, "displayName")) {
        const displayName = String(data.displayName || "").trim();

        if (!displayName) {
            throw new TypeError("A display name is required.");
        }

        updates.displayName = displayName;
    }

    if (Object.hasOwn(data, "photoURL")) {
        updates.photoURL = data.photoURL || null;
    }

    if (!Object.keys(updates).length) {
        throw new TypeError("At least one profile field is required.");
    }

    await setDoc(
        doc(db, "users", userId),
        {
            ...updates,
            updatedAt: serverTimestamp()
        },
        { merge: true }
    );

    return updates;
}

/**
 * Loads a user's profile, returning null when it does not exist.
 *
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
export async function getUserProfile(userId) {
    if (!userId) {
        throw new TypeError("A user ID is required.");
    }

    const snapshot = await getDoc(doc(db, "users", userId));

    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}
