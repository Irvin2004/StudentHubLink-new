import {
    getDateKey,
    getDueGroup,
    getDueLabel,
    getDueStatusLabel,
    sortTasksByDueDate
} from "./task-grouping.js";

const PRIORITY_RANK = Object.freeze({
    High: 3,
    Medium: 2,
    Low: 1
});

export function normalizePlannerTask(task, today = new Date()) {
    const dueGroup = getDueGroup(task.dueDate, today, task.completed);

    return {
        ...task,
        dueGroup,
        dueLabel: getDueLabel(dueGroup),
        dueStatus: task.completed
            ? "Completed"
            : getDueStatusLabel(task.dueDate, today),
        estimatedTime: `${task.estimatedMinutes} min`
    };
}

export function selectActiveTasks(tasks = []) {
    return tasks.filter((task) => !task.completed);
}

export function selectCompletedTaskCount(tasks = []) {
    return tasks.filter((task) => task.completed).length;
}

export function selectActiveTaskCount(tasks = []) {
    return selectActiveTasks(tasks).length;
}

export function selectPlannerProgress(tasks = []) {
    if (!tasks.length) return 0;

    return Math.round((selectCompletedTaskCount(tasks) / tasks.length) * 100);
}

export function selectFocusTask(tasks = []) {
    return (
        [...selectActiveTasks(tasks)].sort((first, second) => {
            const priorityDifference =
                (PRIORITY_RANK[second.priority] || 0) -
                (PRIORITY_RANK[first.priority] || 0);

            if (priorityDifference) return priorityDifference;

            return String(first.dueDate || "9999-12-31").localeCompare(
                String(second.dueDate || "9999-12-31")
            );
        })[0] || null
    );
}

export function selectUpcomingTasks(tasks = [], limit = 3) {
    return sortTasksByDueDate(selectActiveTasks(tasks)).slice(0, limit);
}

export function selectActiveStudyMinutes(tasks = []) {
    return selectActiveTasks(tasks).reduce(
        (total, task) => total + Number(task.estimatedMinutes || 0),
        0
    );
}

export function selectTodayStudyMinutes(tasks = [], today = new Date()) {
    const todayKey = getDateKey(today);

    return selectActiveTasks(tasks)
        .filter((task) => task.dueDate === todayKey)
        .reduce((total, task) => total + Number(task.estimatedMinutes || 0), 0);
}
