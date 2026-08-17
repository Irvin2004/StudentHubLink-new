import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "../../../hooks/useAuth.js";
import { getFlashcardDecks } from "../../flashcards/services/flashcard-service.js";
import { getQuizzes } from "../../quizzes/services/quiz-service.js";
import {
    addStudyTask,
    deleteStudyTask,
    deleteStudyTasks,
    getStudyPlanner,
    toggleStudyTask,
    updateStudyTask
} from "../services/study-planner-service.js";
import {
    normalizePlannerTask,
    selectActiveStudyMinutes,
    selectCompletedTaskCount,
    selectPlannerProgress,
    selectTodayStudyMinutes
} from "../utils/planner-selectors.js";

const EMPTY_PLANNER = {
    tasks: []
};

export function useStudyPlanner() {
    const { user } = useAuth();
    const userId = user?.uid ?? null;
    const [planner, setPlanner] = useState(EMPTY_PLANNER);
    const [loading, setLoading] = useState(Boolean(userId));
    const [error, setError] = useState(null);
    const [mutationError, setMutationError] = useState(null);
    const [flashcardDecks, setFlashcardDecks] = useState([]);
    const [quizzes, setQuizzes] = useState([]);

    useEffect(() => {
        let active = true;

        if (!userId) {
            return () => {
                active = false;
            };
        }

        async function loadPlanner() {
            setLoading(true);
            setError(null);

            try {
                const [nextPlanner, nextDecks, nextQuizzes] = await Promise.all(
                    [
                        getStudyPlanner(userId),
                        getFlashcardDecks(userId).catch(() => []),
                        getQuizzes(userId).catch(() => [])
                    ]
                );

                if (active) {
                    setPlanner({
                        tasks: nextPlanner.tasks.map((task) =>
                            normalizePlannerTask(task)
                        )
                    });
                    setFlashcardDecks(nextDecks);
                    setQuizzes(nextQuizzes);
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

        void loadPlanner();

        return () => {
            active = false;
        };
    }, [userId]);

    const addTask = useCallback(
        async (taskInput) => {
            if (!userId) throw new Error("Authentication is required.");

            setMutationError(null);
            let savedTask;

            try {
                savedTask = await addStudyTask(userId, {
                    title: taskInput.title,
                    subject: taskInput.subject,
                    notes: taskInput.notes,
                    dueDate: taskInput.dueDate,
                    estimatedMinutes: Number(taskInput.estimatedTime),
                    priority: taskInput.priority,
                    ...(taskInput.flashcardDeckId
                        ? { flashcardDeckId: taskInput.flashcardDeckId }
                        : {}),
                    ...(taskInput.taskType
                        ? { taskType: taskInput.taskType }
                        : {}),
                    ...(taskInput.quizId ? { quizId: taskInput.quizId } : {})
                });
            } catch (nextError) {
                setMutationError(nextError);
                throw nextError;
            }
            const nextTask = normalizePlannerTask(savedTask);

            setPlanner((current) => ({
                ...current,
                tasks: [nextTask, ...current.tasks]
            }));

            return nextTask;
        },
        [userId]
    );

    const toggleTask = useCallback(
        async (taskId) => {
            if (!userId) throw new Error("Authentication is required.");

            const currentTask = planner.tasks.find(
                (task) => task.id === taskId
            );
            if (!currentTask) return;

            const completed = !currentTask.completed;
            setMutationError(null);

            try {
                await toggleStudyTask(userId, taskId, completed);
            } catch (nextError) {
                setMutationError(nextError);
                return;
            }

            setPlanner((current) => ({
                ...current,
                tasks: current.tasks.map((task) =>
                    task.id === taskId
                        ? normalizePlannerTask({ ...task, completed })
                        : task
                )
            }));
        },
        [planner.tasks, userId]
    );

    const editTask = useCallback(
        async (taskId, taskInput) => {
            if (!userId) throw new Error("Authentication is required.");

            const changes = {
                title: taskInput.title,
                subject: taskInput.subject,
                notes: taskInput.notes,
                dueDate: taskInput.dueDate,
                estimatedMinutes: Number(taskInput.estimatedTime),
                priority: taskInput.priority,
                ...(Object.hasOwn(taskInput, "flashcardDeckId")
                    ? { flashcardDeckId: taskInput.flashcardDeckId || null }
                    : {}),
                ...(Object.hasOwn(taskInput, "taskType")
                    ? { taskType: taskInput.taskType || "study" }
                    : {}),
                ...(Object.hasOwn(taskInput, "quizId")
                    ? { quizId: taskInput.quizId || null }
                    : {})
            };
            setMutationError(null);

            try {
                await updateStudyTask(userId, taskId, changes);
            } catch (nextError) {
                setMutationError(nextError);
                throw nextError;
            }

            setPlanner((current) => ({
                ...current,
                tasks: current.tasks.map((task) =>
                    task.id === taskId
                        ? normalizePlannerTask({ ...task, ...changes })
                        : task
                )
            }));
        },
        [userId]
    );

    const deleteTask = useCallback(
        async (taskId) => {
            if (!userId) throw new Error("Authentication is required.");

            setMutationError(null);

            try {
                await deleteStudyTask(userId, taskId);
            } catch (nextError) {
                setMutationError(nextError);
                return false;
            }
            setPlanner((current) => ({
                ...current,
                tasks: current.tasks.filter((task) => task.id !== taskId)
            }));
            return true;
        },
        [userId]
    );

    const clearCompleted = useCallback(async () => {
        if (!userId) throw new Error("Authentication is required.");

        const completedTaskIds = planner.tasks
            .filter((task) => task.completed)
            .map((task) => task.id);
        if (!completedTaskIds.length) return true;

        setMutationError(null);

        try {
            await deleteStudyTasks(userId, completedTaskIds);
        } catch (nextError) {
            setMutationError(nextError);
            return false;
        }

        setPlanner((current) => ({
            ...current,
            tasks: current.tasks.filter((task) => !task.completed)
        }));
        return true;
    }, [planner.tasks, userId]);

    const progress = useMemo(
        () => selectPlannerProgress(planner.tasks),
        [planner.tasks]
    );

    const completedTasks = useMemo(
        () => selectCompletedTaskCount(planner.tasks),
        [planner.tasks]
    );

    const activeStudyMinutes = useMemo(
        () => selectActiveStudyMinutes(planner.tasks),
        [planner.tasks]
    );

    const todayStudyMinutes = useMemo(
        () => selectTodayStudyMinutes(planner.tasks),
        [planner.tasks]
    );

    return {
        addTask,
        activeStudyMinutes,
        clearCompleted,
        completedTasks,
        deleteTask,
        editTask,
        error,
        flashcardDecks,
        loading,
        mutationError,
        quizzes,
        progress,
        tasks: planner.tasks,
        todayStudyMinutes,
        totalTasks: planner.tasks.length,
        toggleTask
    };
}
