import { normalizeEmail } from "../utils/normalize-email.js";

const DEFAULT_ROLE = "student";
const DEFAULT_SETTINGS = Object.freeze({
    theme: "system"
});

/**
 * Normalizes the profile persisted for an authenticated user.
 *
 * @param {{uid: string, email?: string|null, displayName?: string|null, photoURL?: string|null}} user
 * @param {{fullName?: string, photoURL?: string|null}} [data]
 * @returns {{uid: string, email: string, displayName: string, photoURL: string|null, role: string, settings: {theme: string}}}
 */
export function createUserProfile(user, data = {}) {
    if (!user?.uid) {
        throw new TypeError("A Firebase user with a UID is required.");
    }

    const displayName = String(data.fullName || user.displayName || "").trim();
    const email = normalizeEmail(user.email);

    if (!displayName) {
        throw new TypeError("A display name is required.");
    }

    if (!email) {
        throw new TypeError("An email address is required.");
    }

    return Object.freeze({
        uid: user.uid,
        email,
        displayName,
        photoURL: data.photoURL ?? user.photoURL ?? null,
        role: DEFAULT_ROLE,
        settings: DEFAULT_SETTINGS
    });
}
