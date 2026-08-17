import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../../../hooks/useAuth.js";
import { getResourceLibraryData } from "../../../services/file-service.js";
import { getFlashcardDecks } from "../../flashcards/services/flashcard-service.js";
import {
    getFlashcardDashboardData,
    toFlashcardFocus
} from "../../flashcards/utils/flashcard-selectors.js";
import { getQuizLibraryData } from "../../quizzes/services/quiz-service.js";
import { getQuizDashboardData } from "../../quizzes/utils/quiz-selectors.js";
import {
    formatResourceLastOpened,
    getResourceDashboardData,
    resourceTimestamp
} from "../../resourceLibrary/utils/resource-library.js";
import { getStudyPlanner } from "../../studyPlanner/services/study-planner-service.js";
import {
    getStudyPreferences,
    getStudySessions
} from "../../studySessions/services/study-session-service.js";
import {
    selectStudyAnalytics,
    WEEKLY_GOAL_MINUTES
} from "../../studySessions/utils/study-session-selectors.js";
import { getDashboard } from "../services/dashboard-service.js";
import { getPlannerDashboardData } from "../utils/planner-dashboard-data.js";

const EMPTY_DASHBOARD = {
    aiSuggestions: [],
    activity: [],
    continueLearning: [],
    deadlines: [],
    favoriteResources: [],
    focusTask: null,
    greeting: {
        name: "",
        message: ""
    },
    studyStreak: {
        current: 0,
        longest: 0,
        progress: 0
    },
    quickActions: [],
    stats: {
        communities: 0,
        messages: 0,
        resources: 0,
        tasks: 0,
        dueFlashcards: 0,
        recentQuizScore: null,
        weakQuizTopics: 0
    },
    weeklyProgress: 0,
    weeklyMinutes: 0,
    weeklyGoalMinutes: WEEKLY_GOAL_MINUTES
};

export function useDashboard() {
    const { user } = useAuth();
    const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshIndex, setRefreshIndex] = useState(0);

    const reload = useCallback(() => {
        setRefreshIndex((current) => current + 1);
    }, []);

    useEffect(() => {
        let active = true;

        async function loadDashboard() {
            setLoading(true);
            setError(null);

            try {
                const userId = user?.uid;
                const [
                    nextDashboard,
                    planner,
                    library,
                    sessions,
                    preferences,
                    flashcardDecks,
                    quizLibrary
                ] = await Promise.all([
                    getDashboard(userId),
                    userId ? getStudyPlanner(userId) : { tasks: [] },
                    userId
                        ? getResourceLibraryData(userId)
                        : { favorites: {}, resources: [] },
                    userId ? getStudySessions(userId) : [],
                    userId
                        ? getStudyPreferences(userId)
                        : { weeklyGoalMinutes: WEEKLY_GOAL_MINUTES },
                    userId ? getFlashcardDecks(userId) : [],
                    userId ? getQuizLibraryData(userId) : []
                ]);
                const plannerData = getPlannerDashboardData(planner.tasks);
                const resourceData = {
                    ...getResourceDashboardData(
                        library.resources,
                        library.favorites,
                        10
                    ),
                    resourceCount:
                        library.totalCount ?? library.resources.length
                };
                const flashcardData = getFlashcardDashboardData(flashcardDecks);
                const quizData = getQuizDashboardData(quizLibrary);
                const continueLearning = [
                    ...resourceData.recentResources.map((resource) => ({
                        ...resource,
                        lastOpenedLabel: formatResourceLastOpened(
                            resource.lastOpened
                        ),
                        learningType: "resource",
                        subject: resource.communityName
                    })),
                    ...flashcardData.recentDecks.map((deck) => ({
                        ...deck,
                        deckId: deck.id,
                        lastOpened: deck.lastStudiedAt,
                        lastOpenedLabel: formatResourceLastOpened(
                            deck.lastStudiedAt
                        ),
                        learningType: "flashcard",
                        subject: deck.subject
                    })),
                    ...(quizData.recentQuiz
                        ? [
                              {
                                  ...quizData.recentQuiz,
                                  lastOpened:
                                      quizData.recentQuiz.stats
                                          .latestCompletedAt,
                                  lastOpenedLabel: formatResourceLastOpened(
                                      quizData.recentQuiz.stats
                                          .latestCompletedAt
                                  ),
                                  learningType: "quiz",
                                  progress:
                                      quizData.recentQuiz.stats.latestScore,
                                  quizId: quizData.recentQuiz.id
                              }
                          ]
                        : [])
                ]
                    .sort(
                        (first, second) =>
                            resourceTimestamp(second.lastOpened) -
                            resourceTimestamp(first.lastOpened)
                    )
                    .slice(0, 3);
                const studyAnalytics = selectStudyAnalytics(
                    sessions,
                    new Date(),
                    preferences.weeklyGoalMinutes
                );

                if (active) {
                    setDashboard({
                        ...nextDashboard,
                        continueLearning,
                        favoriteResources: resourceData.favoriteResources,
                        deadlines: plannerData.deadlines,
                        focusTask:
                            plannerData.focusTask ||
                            toFlashcardFocus(flashcardData.dueDeck),
                        stats: {
                            ...nextDashboard.stats,
                            resources: resourceData.resourceCount,
                            tasks: plannerData.activeTaskCount,
                            dueFlashcards: flashcardData.dueCount,
                            recentQuizScore: quizData.recentQuizScore,
                            weakQuizTopics: quizData.weakTopicCount
                        },
                        studyStreak: studyAnalytics.streak,
                        weeklyGoalMinutes: preferences.weeklyGoalMinutes,
                        weeklyMinutes: studyAnalytics.weeklyMinutes,
                        weeklyProgress: studyAnalytics.weeklyProgress
                    });
                }
            } catch (nextError) {
                if (active) {
                    setError(nextError);
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        void loadDashboard();

        return () => {
            active = false;
        };
    }, [refreshIndex, user?.uid]);

    useEffect(() => {
        window.addEventListener("study-session-completed", reload);
        window.addEventListener("study-goal-updated", reload);
        window.addEventListener("flashcards-updated", reload);
        window.addEventListener("quiz-attempt-completed", reload);
        return () => {
            window.removeEventListener("study-session-completed", reload);
            window.removeEventListener("study-goal-updated", reload);
            window.removeEventListener("flashcards-updated", reload);
            window.removeEventListener("quiz-attempt-completed", reload);
        };
    }, [reload]);

    return {
        dashboard,
        error,
        loading,
        reload
    };
}
