function timestampValue(value) {
    if (typeof value?.toMillis === "function") return value.toMillis();
    if (typeof value?.toDate === "function") return value.toDate().getTime();
    if (value instanceof Date) return value.getTime();
    const timestamp = new Date(value || 0).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
}

function completedAt(attempt) {
    return attempt?.completedAt || attempt?.submittedAt;
}

export function selectRecentQuizAttempts(attempts = []) {
    return [...attempts].sort(
        (first, second) =>
            timestampValue(completedAt(second)) -
            timestampValue(completedAt(first))
    );
}

export function getQuizStats(attempts = []) {
    const recentAttempts = selectRecentQuizAttempts(attempts);
    const percentages = recentAttempts.map(
        (attempt) => Number(attempt.percentage) || 0
    );
    return {
        attempts: recentAttempts.length,
        averageScore: percentages.length
            ? Math.round(
                  percentages.reduce((total, score) => total + score, 0) /
                      percentages.length
              )
            : 0,
        bestScore: percentages.length ? Math.max(...percentages) : 0,
        latestCompletedAt: completedAt(recentAttempts[0]) || null,
        latestScore: percentages[0] ?? 0
    };
}

export function selectRecentlyTakenQuizzes(quizzes = []) {
    return [...quizzes]
        .map((quiz) => ({ ...quiz, stats: getQuizStats(quiz.attempts) }))
        .sort((first, second) => {
            const attemptDifference =
                timestampValue(second.stats.latestCompletedAt) -
                timestampValue(first.stats.latestCompletedAt);
            if (attemptDifference) return attemptDifference;
            return (
                timestampValue(second.updatedAt) -
                timestampValue(first.updatedAt)
            );
        });
}

export function selectWeakQuestions(questions = [], attempts = []) {
    const incorrectCounts = new Map();
    attempts.forEach((attempt) => {
        if (!Array.isArray(attempt.answers)) return;
        attempt.answers.forEach((answer) => {
            if (answer?.correct === false && answer.questionId) {
                incorrectCounts.set(
                    answer.questionId,
                    (incorrectCounts.get(answer.questionId) || 0) + 1
                );
            }
        });
    });
    return questions
        .filter((question) => incorrectCounts.has(question.id))
        .map((question) => ({
            ...question,
            incorrectCount: incorrectCounts.get(question.id)
        }))
        .sort(
            (first, second) =>
                second.incorrectCount - first.incorrectCount ||
                first.position - second.position
        );
}

export function getQuizDashboardData(quizzes = []) {
    const recentQuizzes = selectRecentlyTakenQuizzes(quizzes).filter(
        (quiz) => quiz.stats.attempts > 0
    );
    const recentQuiz = recentQuizzes[0] || null;
    const weakSubjects = new Set();
    quizzes.forEach((quiz) => {
        const hasIncorrectAnswer = quiz.attempts?.some((attempt) =>
            Array.isArray(attempt.answers)
                ? attempt.answers.some((answer) => answer.correct === false)
                : false
        );
        if (hasIncorrectAnswer && quiz.subject) weakSubjects.add(quiz.subject);
    });
    return {
        recentQuiz,
        recentQuizScore: recentQuiz?.stats.latestScore ?? null,
        weakTopicCount: weakSubjects.size
    };
}

export { timestampValue as quizTimestamp };
