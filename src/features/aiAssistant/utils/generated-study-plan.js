import { isDateKey } from "../../studyPlanner/utils/task-grouping.js";

const VALID_PRIORITIES = new Set(["Low", "Medium", "High"]);

function clean(value, maximum = Number.POSITIVE_INFINITY) {
    return String(value || "")
        .trim()
        .slice(0, maximum);
}

function canLinkResource(resourceId) {
    const value = clean(resourceId);
    return Boolean(
        value &&
        !value.startsWith("collection:") &&
        !value.startsWith("set:") &&
        !value.startsWith("question:") &&
        !value.startsWith("quiz:") &&
        !value.startsWith("flashcard-set:")
    );
}

export function prepareGeneratedStudyPlan(result = {}) {
    return (result.tasks || []).map((task, index) => ({
        dueDate: clean(task.dueDate),
        estimatedMinutes: Math.max(
            5,
            Math.min(480, Math.round(Number(task.estimatedMinutes) || 30))
        ),
        flashcardDeckId: clean(task.flashcardDeckId),
        id: clean(task.id) || `generated-task-${index + 1}`,
        notes: clean(task.notes, 500),
        priority: VALID_PRIORITIES.has(task.priority)
            ? task.priority
            : "Medium",
        quizId: clean(task.quizId),
        resourceId: canLinkResource(task.resourceId || result.resourceId)
            ? clean(task.resourceId || result.resourceId)
            : "",
        selected: task.selected !== false,
        subject: clean(task.subject || result.subject, 120),
        taskType: clean(task.taskType) || "study",
        title: clean(task.title, 160)
    }));
}

export function validateGeneratedStudyPlan(tasks = []) {
    const selected = tasks.filter((task) => task.selected);
    if (!selected.length) {
        throw new TypeError("Select at least one task to add to your planner.");
    }
    selected.forEach((task, index) => {
        if (!clean(task.title)) {
            throw new TypeError(`Task ${index + 1} needs a title.`);
        }
        if (!clean(task.subject)) {
            throw new TypeError(`Task ${index + 1} needs a subject.`);
        }
        if (!isDateKey(task.dueDate)) {
            throw new TypeError(`Task ${index + 1} needs a valid due date.`);
        }
        const minutes = Number(task.estimatedMinutes);
        if (!Number.isInteger(minutes) || minutes < 5 || minutes > 480) {
            throw new TypeError(
                `Task ${index + 1} must last between 5 and 480 minutes.`
            );
        }
        if (!VALID_PRIORITIES.has(task.priority)) {
            throw new TypeError(`Task ${index + 1} needs a valid priority.`);
        }
    });
    return selected.map(({ id: _id, selected: _selected, ...task }) => ({
        ...task,
        estimatedMinutes: Number(task.estimatedMinutes),
        ...(task.flashcardDeckId ? {} : { flashcardDeckId: undefined }),
        ...(task.quizId ? {} : { quizId: undefined }),
        ...(task.resourceId ? {} : { resourceId: undefined })
    }));
}
