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

    const timestamps = {
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
    };
    const publicProfile = {
        displayName: profile.displayName,
        fullName: profile.displayName,
        photoURL: profile.photoURL,
        profileVisibility: profile.profileVisibility
    };
    await Promise.all([
        setDoc(doc(db, "users", user.uid), {
            ...profile,
            ...timestamps
        }),
        setDoc(doc(db, "publicProfiles", user.uid), {
            ...publicProfile,
            ...timestamps
        })
    ]);

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

    const publicUpdates = {
        ...updates,
        updatedAt: serverTimestamp()
    };
    await Promise.all([
        setDoc(doc(db, "users", userId), publicUpdates, { merge: true }),
        setDoc(doc(db, "publicProfiles", userId), publicUpdates, {
            merge: true
        })
    ]);

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

    if (!snapshot.exists()) return null;
    const profile = { id: snapshot.id, ...snapshot.data() };
    if (!profile.profileVisibility) {
        profile.profileVisibility = "public";
        await setDoc(
            doc(db, "users", userId),
            { profileVisibility: "public", updatedAt: serverTimestamp() },
            { merge: true }
        );
    }

    // Existing accounts are migrated when their owner next signs in. Only
    // allowlisted presentation fields are projected; private account fields
    // (email, role, settings, and financial totals) never leave /users.
    const displayName = String(
        profile.displayName || profile.fullName || profile.name || "Student"
    );
    await setDoc(
        doc(db, "publicProfiles", userId),
        {
            displayName,
            fullName: profile.fullName || displayName,
            name: profile.name || displayName,
            photoURL: profile.photoURL || null,
            institution: profile.institution || "",
            course: profile.course || "",
            yearOfStudy: profile.yearOfStudy || "",
            bio: profile.bio || "",
            profileVisibility: profile.profileVisibility,
            ...(profile.joinedAt ? { joinedAt: profile.joinedAt } : {}),
            ...(profile.createdAt ? { createdAt: profile.createdAt } : {}),
            updatedAt: serverTimestamp()
        },
        { merge: true }
    );
    return profile;
}
