import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "../../../hooks/useAuth.js";
import {
    getStudyPreferences,
    getStudySessions,
    updateWeeklyStudyGoal
} from "../services/study-session-service.js";
import {
    selectStudyAnalytics,
    WEEKLY_GOAL_MINUTES
} from "../utils/study-session-selectors.js";

export function useStudySessions() {
    const { user } = useAuth();
    const userId = user?.uid;
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(Boolean(userId));
    const [error, setError] = useState(null);
    const [goalError, setGoalError] = useState(null);
    const [goalUpdating, setGoalUpdating] = useState(false);
    const [weeklyGoalMinutes, setWeeklyGoalMinutes] =
        useState(WEEKLY_GOAL_MINUTES);
    const [refreshIndex, setRefreshIndex] = useState(0);
    const reload = useCallback(
        () => setRefreshIndex((current) => current + 1),
        []
    );

    useEffect(() => {
        let active = true;
        if (!userId) {
            return undefined;
        }

        async function loadSessions() {
            setLoading(true);
            setError(null);
            try {
                const [nextSessions, preferences] = await Promise.all([
                    getStudySessions(userId),
                    getStudyPreferences(userId)
                ]);
                if (active) {
                    setSessions(nextSessions);
                    setWeeklyGoalMinutes(preferences.weeklyGoalMinutes);
                }
            } catch (nextError) {
                if (active) setError(nextError);
            } finally {
                if (active) setLoading(false);
            }
        }

        void loadSessions();

        return () => {
            active = false;
        };
    }, [refreshIndex, userId]);

    useEffect(() => {
        window.addEventListener("study-session-completed", reload);
        return () =>
            window.removeEventListener("study-session-completed", reload);
    }, [reload]);

    const analytics = useMemo(
        () => selectStudyAnalytics(sessions, new Date(), weeklyGoalMinutes),
        [sessions, weeklyGoalMinutes]
    );

    const setWeeklyGoal = useCallback(
        async (minutes) => {
            if (!userId || goalUpdating) return false;
            const previousGoal = weeklyGoalMinutes;
            const nextGoal = Math.min(
                2_400,
                Math.max(60, Math.round(Number(minutes) || 0))
            );
            setGoalError(null);
            setGoalUpdating(true);
            setWeeklyGoalMinutes(nextGoal);
            try {
                await updateWeeklyStudyGoal(userId, nextGoal);
                window.dispatchEvent(
                    new CustomEvent("study-goal-updated", {
                        detail: { weeklyGoalMinutes: nextGoal }
                    })
                );
                return true;
            } catch (nextError) {
                setWeeklyGoalMinutes(previousGoal);
                setGoalError(nextError);
                return false;
            } finally {
                setGoalUpdating(false);
            }
        },
        [goalUpdating, userId, weeklyGoalMinutes]
    );

    return {
        error,
        goalError,
        goalUpdating,
        loading,
        reload,
        sessions,
        setWeeklyGoal,
        analytics,
        streak: analytics.streak,
        weeklyGoalMinutes,
        weeklyMinutes: analytics.weeklyMinutes,
        weeklyProgress: analytics.weeklyProgress
    };
}
