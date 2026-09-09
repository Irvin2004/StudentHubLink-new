const STORAGE_PREFIX = "studenthub:active-study-session";

function storageKey(userId) {
    return `${STORAGE_PREFIX}:${userId}`;
}

export function readActiveStudySession(userId) {
    if (!userId || typeof window === "undefined" || !window.localStorage) {
        return null;
    }

    try {
        const value = JSON.parse(
            window.localStorage.getItem(storageKey(userId))
        );
        if (!value?.session?.title || !value?.status) return null;

        return {
            accumulatedSeconds: Math.max(
                0,
                Number(value.accumulatedSeconds) || 0
            ),
            runStartedAt: value.runStartedAt
                ? Number(value.runStartedAt)
                : null,
            session: {
                ...value.session,
                startedAt: value.session.startedAt
                    ? new Date(value.session.startedAt)
                    : null
            },
            status:
                value.status === "running"
                    ? "running"
                    : value.status === "paused"
                      ? "paused"
                      : "ready"
        };
    } catch {
        return null;
    }
}

export function writeActiveStudySession(userId, state) {
    if (
        !userId ||
        typeof window === "undefined" ||
        !window.localStorage ||
        !state?.session
    ) {
        return;
    }

    window.localStorage.setItem(
        storageKey(userId),
        JSON.stringify({
            accumulatedSeconds: Math.max(
                0,
                Number(state.accumulatedSeconds) || 0
            ),
            runStartedAt: state.runStartedAt || null,
            session: {
                ...state.session,
                startedAt:
                    state.session.startedAt instanceof Date
                        ? state.session.startedAt.toISOString()
                        : state.session.startedAt || null
            },
            status: state.status
        })
    );
}

export function clearActiveStudySession(userId) {
    if (!userId || typeof window === "undefined" || !window.localStorage)
        return;
    window.localStorage.removeItem(storageKey(userId));
}
