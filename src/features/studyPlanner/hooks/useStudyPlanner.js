import { useCallback, useEffect, useMemo, useState } from "react";

import { getStudyPlanner } from "../services/study-planner-service.js";

const EMPTY_PLANNER = {
    tasks: []
};

function getDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getTomorrowKey() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    return getDateKey(tomorrow);
}

function getDueGroup(dueDate) {
    if (dueDate === getDateKey()) return "today";
    if (dueDate === getTomorrowKey()) return "tomorrow";

    return "week";
}

function getDueLabel(dueGroup) {
    if (dueGroup === "today") return "Today";
    if (dueGroup === "tomorrow") return "Tomorrow";

    return "This Week";
}

export function useStudyPlanner() {
    const [planner, setPlanner] = useState(EMPTY_PLANNER);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let active = true;

        async function loadPlanner() {
            setLoading(true);
            setError(null);

            try {
                const nextPlanner = await getStudyPlanner();

                if (active) {
                    setPlanner(nextPlanner);
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
    }, []);

    const addTask = useCallback((taskInput) => {
        const dueGroup = getDueGroup(taskInput.dueDate);
        const nextTask = {
            id: `study-task-${Date.now()}`,
            title: taskInput.title,
            subject: taskInput.subject,
            dueDate: taskInput.dueDate,
            dueGroup,
            dueLabel: getDueLabel(dueGroup),
            estimatedTime: `${taskInput.estimatedTime} min`,
            priority: taskInput.priority,
            completed: false
        };

        setPlanner((current) => ({
            ...current,
            tasks: [nextTask, ...current.tasks]
        }));
    }, []);

    const progress = useMemo(() => {
        if (!planner.tasks.length) return 0;

        const completedTasks = planner.tasks.filter(
            (task) => task.completed
        ).length;

        return Math.round((completedTasks / planner.tasks.length) * 100);
    }, [planner.tasks]);

    return {
        error,
        addTask,
        loading,
        progress,
        tasks: planner.tasks
    };
}
