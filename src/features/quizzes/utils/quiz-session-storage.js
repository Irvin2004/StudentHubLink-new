const STORAGE_PREFIX = "studenthub.quiz-session";

function storageKey(quizId) {
    return `${STORAGE_PREFIX}.${String(quizId || "unknown")}`;
}

export function createQuizAttemptId(quizId) {
    const randomId = globalThis.crypto?.randomUUID?.();
    return randomId || `${String(quizId || "quiz")}-${Date.now()}`;
}

export function loadQuizSession(quizId, questions, practiceWeak = false) {
    try {
        const parsed = JSON.parse(
            window.sessionStorage.getItem(storageKey(quizId)) || "null"
        );
        const questionIds = questions.map((question) => question.id);
        if (
            !parsed ||
            parsed.quizId !== quizId ||
            parsed.practiceWeak !== practiceWeak ||
            JSON.stringify(parsed.questionIds) !== JSON.stringify(questionIds)
        ) {
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

export function saveQuizSession(quizId, session) {
    try {
        window.sessionStorage.setItem(
            storageKey(quizId),
            JSON.stringify({ ...session, quizId })
        );
    } catch {
        // Recovery is best-effort when browser storage is unavailable.
    }
}

export function clearQuizSession(quizId) {
    try {
        window.sessionStorage.removeItem(storageKey(quizId));
    } catch {
        // Recovery is best-effort when browser storage is unavailable.
    }
}
