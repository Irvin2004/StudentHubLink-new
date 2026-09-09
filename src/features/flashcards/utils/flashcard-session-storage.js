const SESSION_KEY = "studenthub:flashcard-study-session";

function getStorage() {
    try {
        return window.sessionStorage;
    } catch {
        return null;
    }
}

export function loadFlashcardStudySession() {
    try {
        const value = JSON.parse(getStorage()?.getItem(SESSION_KEY) || "null");
        if (
            !value ||
            !String(value.deckId || "").trim() ||
            !Array.isArray(value.cardIds) ||
            !value.cardIds.length ||
            !Number.isFinite(value.startedAt)
        ) {
            return null;
        }
        return value;
    } catch {
        return null;
    }
}

export function saveFlashcardStudySession(session) {
    try {
        getStorage()?.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
        // Recovery is best effort; a blocked storage API must not stop studying.
    }
}

export function clearFlashcardStudySession() {
    try {
        getStorage()?.removeItem(SESSION_KEY);
    } catch {
        // Recovery is best effort.
    }
}

export { SESSION_KEY as FLASHCARD_SESSION_KEY };
