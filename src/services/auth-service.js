import {
    createUserWithEmailAndPassword,
    deleteUser,
    onAuthStateChanged as observeFirebaseAuthState,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
    updateProfile as updateFirebaseProfile
} from "firebase/auth";

import { auth, initializeAuthPersistence } from "../firebase/auth.js";
import { normalizeEmail } from "../utils/normalize-email.js";

/**
 * Subscribes to Firebase authentication state.
 *
 * @param {(user: import("firebase/auth").User|null) => void} onChange
 * @param {(error: Error) => void} [onError]
 * @returns {() => void}
 */
export function onAuthStateChanged(onChange, onError = () => {}) {
    if (typeof onChange !== "function") {
        throw new TypeError("An authentication callback is required.");
    }

    let active = true;
    let unsubscribe = null;

    void initializeAuthPersistence()
        .then(() => {
            if (active) {
                unsubscribe = observeFirebaseAuthState(auth, onChange, onError);
            }
        })
        .catch((error) => {
            if (active) onError(error);
        });

    return () => {
        active = false;
        unsubscribe?.();
        unsubscribe = null;
    };
}

/**
 * Authenticates a user with email and password.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import("firebase/auth").User>}
 */
export async function login(email, password) {
    await initializeAuthPersistence();

    const credential = await signInWithEmailAndPassword(
        auth,
        normalizeEmail(email),
        password
    );

    return credential.user;
}

/**
 * Registers an account and creates its Firestore profile.
 *
 * @param {{fullName: string, email: string, password: string}} input
 * @returns {Promise<import("firebase/auth").User>}
 */
export async function register({ fullName, email, password }) {
    await initializeAuthPersistence();

    const credential = await createUserWithEmailAndPassword(
        auth,
        normalizeEmail(email),
        password
    );
    const user = credential.user;
    const displayName = fullName.trim();

    try {
        const { createUserProfileDocument } =
            await import("./user-profile-service.js");
        await updateFirebaseProfile(user, { displayName });
        await createUserProfileDocument(user, { fullName: displayName });
    } catch (error) {
        try {
            await deleteUser(user);
        } catch {
            // Preserve the original registration failure for the controller.
        }

        throw error;
    }

    return user;
}

/**
 * Sends a password reset email.
 *
 * @param {string} email
 * @returns {Promise<void>}
 */
export async function resetPassword(email) {
    await initializeAuthPersistence();
    await sendPasswordResetEmail(auth, normalizeEmail(email));
}

/**
 * Signs out the active user.
 *
 * @returns {Promise<void>}
 */
export async function logout() {
    await initializeAuthPersistence();
    await signOut(auth);
}

/**
 * Updates the active user's Firebase and Firestore profile.
 *
 * @param {{displayName?: string, photoURL?: string|null}} data
 * @returns {Promise<import("firebase/auth").User>}
 */
export async function updateProfile(data = {}) {
    await initializeAuthPersistence();

    const user = auth.currentUser;

    if (!user) {
        throw new Error("An authenticated user is required.");
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

    await updateFirebaseProfile(user, updates);
    const { updateUserProfileDocument } =
        await import("./user-profile-service.js");
    await updateUserProfileDocument(user.uid, updates);

    return user;
}
