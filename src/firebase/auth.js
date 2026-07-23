import {
    browserLocalPersistence,
    getAuth,
    setPersistence
} from "firebase/auth";

import { app } from "./app.js";

export const auth = getAuth(app);

let persistencePromise = null;

/**
 * Configures Firebase Auth to retain the user's session across browser restarts.
 *
 * @returns {Promise<void>}
 */
export function initializeAuthPersistence() {
    if (!persistencePromise) {
        persistencePromise = setPersistence(auth, browserLocalPersistence);
    }

    return persistencePromise;
}
