import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

import { auth } from "../firebase.js";
import {
    setUserOffline,
    setUserOnline
} from "../services/presence-service.js";

let initialized = false;
let activeUserId = null;

function reportPresenceError(action, error) {
    console.warn(`Unable to mark user ${action}:`, error);
}

export function initializePresence() {
    if (initialized) return;

    initialized = true;

    onAuthStateChanged(auth, (user) => {
        activeUserId = user?.uid || null;

        if (!activeUserId) return;

        setUserOnline(activeUserId).catch((error) => {
            reportPresenceError("online", error);
        });
    });

    window.addEventListener("beforeunload", () => {
        if (!activeUserId) return;

        setUserOffline(activeUserId).catch((error) => {
            reportPresenceError("offline", error);
        });
    });
}
