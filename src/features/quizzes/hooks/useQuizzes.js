import { useCallback, useEffect, useMemo, useState } from "react";

import { ANALYTICS_EVENTS } from "../../../config/analytics-events.js";
import { useAuth } from "../../../hooks/useAuth.js";
import { useAnalytics } from "../../../hooks/useAnalytics.js";
import { recordQuizLearningMemory } from "../../learningMemory/services/learning-memory-service.js";
import { completeStudySession } from "../../studySessions/services/study-session-service.js";
import {
    MINIMUM_SESSION_SECONDS,
    secondsToStudyMinutes
} from "../../studySessions/utils/study-session-selectors.js";
import {
    createQuiz,
    createQuizQuestion,
    deleteQuiz,
    deleteQuizQuestion,
    getQuizQuestions,
    getQuizLibraryData,
    saveQuizAttempt,
    updateQuizQuestion
} from "../services/quiz-service.js";
import { selectRecentlyTakenQuizzes } from "../utils/quiz-selectors.js";

export function useQuizzes() {
    const { track } = useAnalytics();
    const { user } = useAuth();
    const userId = user?.uid;
    const [quizzes, setQuizzes] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [selectedQuizId, setSelectedQuizId] = useState(null);
    const [loading, setLoading] = useState(Boolean(userId));
    const [questionsLoading, setQuestionsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [questionsError, setQuestionsError] = useState(null);
    const [mutationError, setMutationError] = useState(null);
    const [refreshIndex, setRefreshIndex] = useState(0);
    const reload = useCallback(() => setRefreshIndex((value) => value + 1), []);

    useEffect(() => {
        if (!userId) return undefined;
        let active = true;
        async function load() {
            setLoading(true);
            setError(null);
            try {
                const nextQuizzes = await getQuizLibraryData(userId);
                if (active) {
                    setQuizzes(selectRecentlyTakenQuizzes(nextQuizzes));
                }
            } catch (nextError) {
                if (active) setError(nextError);
            } finally {
                if (active) setLoading(false);
            }
        }
        void load();
        return () => {
            active = false;
        };
    }, [refreshIndex, userId]);

    useEffect(() => {
        window.addEventListener("quizzes-updated", reload);
        return () => window.removeEventListener("quizzes-updated", reload);
    }, [reload]);

    useEffect(() => {
        if (!userId || !selectedQuizId) return undefined;
        let active = true;
        async function loadQuestions() {
            setQuestionsLoading(true);
            setQuestionsError(null);
            try {
                const nextQuestions = await getQuizQuestions(
                    userId,
                    selectedQuizId
                );
                if (active) setQuestions(nextQuestions);
            } catch (nextError) {
                if (active) setQuestionsError(nextError);
            } finally {
                if (active) setQuestionsLoading(false);
            }
        }
        void loadQuestions();
        return () => {
            active = false;
        };
    }, [selectedQuizId, userId]);

    const selectedQuiz = useMemo(
        () => quizzes.find((quiz) => quiz.id === selectedQuizId) || null,
        [quizzes, selectedQuizId]
    );

    const selectQuiz = useCallback((quizId) => {
        setQuestions([]);
        setQuestionsError(null);
        setSelectedQuizId(quizId);
    }, []);

    const addQuiz = useCallback(
        async (input) => {
            setMutationError(null);
            try {
                const created = await createQuiz(userId, input);
                setQuizzes((current) => [
                    {
                        ...created,
                        attempts: [],
                        stats: {
                            attempts: 0,
                            averageScore: 0,
                            bestScore: 0,
                            latestCompletedAt: null,
                            latestScore: 0
                        }
                    },
                    ...current
                ]);
                setSelectedQuizId(created.id);
                setQuestions([]);
                return created;
            } catch (nextError) {
                setMutationError(nextError);
                throw nextError;
            }
        },
        [userId]
    );

    const removeQuiz = useCallback(
        async (quizId) => {
            try {
                await deleteQuiz(userId, quizId);
                setQuizzes((current) =>
                    current.filter((quiz) => quiz.id !== quizId)
                );
                if (selectedQuizId === quizId) {
                    setSelectedQuizId(null);
                    setQuestions([]);
                }
                return true;
            } catch (nextError) {
                setMutationError(nextError);
                return false;
            }
        },
        [selectedQuizId, userId]
    );

    const addQuestion = useCallback(
        async (input) => {
            const created = await createQuizQuestion(userId, selectedQuizId, {
                ...input,
                position:
                    questions.reduce(
                        (highest, question) =>
                            Math.max(highest, Number(question.position) || 0),
                        -1
                    ) + 1,
                questionCount: questions.length + 1
            });
            const nextQuestions = [...questions, created];
            setQuestions(nextQuestions);
            setQuizzes((current) =>
                current.map((quiz) =>
                    quiz.id === selectedQuizId
                        ? { ...quiz, questionCount: nextQuestions.length }
                        : quiz
                )
            );
            return created;
        },
        [questions, selectedQuizId, userId]
    );

    const editQuestion = useCallback(
        async (questionId, changes) => {
            const update = await updateQuizQuestion(
                userId,
                selectedQuizId,
                questionId,
                changes
            );
            setQuestions((current) =>
                current.map((question) =>
                    question.id === questionId
                        ? { ...question, ...update }
                        : question
                )
            );
            return true;
        },
        [selectedQuizId, userId]
    );

    const removeQuestion = useCallback(
        async (questionId) => {
            try {
                const nextQuestions = questions.filter(
                    (question) => question.id !== questionId
                );
                await deleteQuizQuestion(
                    userId,
                    selectedQuizId,
                    questionId,
                    nextQuestions.length
                );
                setQuestions(nextQuestions);
                setQuizzes((current) =>
                    current.map((quiz) =>
                        quiz.id === selectedQuizId
                            ? { ...quiz, questionCount: nextQuestions.length }
                            : quiz
                    )
                );
                return true;
            } catch (nextError) {
                setMutationError(nextError);
                return false;
            }
        },
        [questions, selectedQuizId, userId]
    );

    const recordAttempt = useCallback(
        async (attempt) => {
            const saved = await saveQuizAttempt(
                userId,
                selectedQuizId,
                attempt
            );
            try {
                await recordQuizLearningMemory(userId, selectedQuiz, saved);
            } catch {
                // The quiz attempt remains authoritative if memory sync fails.
            }
            if (attempt.durationSeconds >= MINIMUM_SESSION_SECONDS) {
                try {
                    const session = await completeStudySession(userId, {
                        actualMinutes: secondsToStudyMinutes(
                            attempt.durationSeconds
                        ),
                        durationSeconds: attempt.durationSeconds,
                        quizId: selectedQuizId,
                        sessionId: `quiz-${saved.id}`,
                        sourceType: "quiz",
                        startedAt: attempt.startedAt,
                        subject: selectedQuiz?.subject,
                        taskId: attempt.taskId,
                        title: selectedQuiz?.title
                    });
                    window.dispatchEvent(
                        new CustomEvent("study-session-completed", {
                            detail: session
                        })
                    );
                } catch {
                    // The attempt remains saved even if its analytics record fails.
                }
            }
            setQuizzes((current) =>
                selectRecentlyTakenQuizzes(
                    current.map((quiz) =>
                        quiz.id === selectedQuizId
                            ? {
                                  ...quiz,
                                  attempts: [saved, ...(quiz.attempts || [])]
                              }
                            : quiz
                    )
                )
            );
            window.dispatchEvent(new Event("quiz-attempt-completed"));
            track(ANALYTICS_EVENTS.QUIZ_ATTEMPT_COMPLETED, {
                durationSeconds: Number(attempt.durationSeconds) || 0,
                percentage: Number(saved.percentage) || 0,
                questionCount: Array.isArray(saved.answers)
                    ? saved.answers.length
                    : 0
            });
            return saved;
        },
        [selectedQuiz, selectedQuizId, track, userId]
    );

    return {
        addQuestion,
        addQuiz,
        editQuestion,
        error,
        loading,
        mutationError,
        questions,
        questionsError,
        questionsLoading,
        recordAttempt,
        reload,
        removeQuestion,
        removeQuiz,
        selectQuiz,
        selectedQuiz,
        quizzes
    };
}

export default useQuizzes;
