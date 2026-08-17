import {
    formatStudyTime,
    getDueStatusLabel
} from "../../studyPlanner/utils/task-grouping.js";
import {
    selectActiveTaskCount,
    selectFocusTask,
    selectPlannerProgress,
    selectUpcomingTasks
} from "../../studyPlanner/utils/planner-selectors.js";

function toDashboardTask(task) {
    return {
        id: task.id,
        title: task.title,
        subject: task.subject,
        due: getDueStatusLabel(task.dueDate),
        dueDate: task.dueDate,
        estimatedTime: formatStudyTime(task.estimatedMinutes),
        flashcardDeckId: task.flashcardDeckId,
        quizId: task.quizId,
        priority: task.priority,
        type:
            task.taskType === "flashcards" && task.flashcardDeckId
                ? "flashcards"
                : task.taskType === "quiz" && task.quizId
                  ? "quiz"
                  : undefined
    };
}

export function getPlannerDashboardData(tasks = []) {
    const focusTask = selectFocusTask(tasks);

    return {
        activeTaskCount: selectActiveTaskCount(tasks),
        deadlines: selectUpcomingTasks(tasks).map(toDashboardTask),
        focusTask: focusTask ? toDashboardTask(focusTask) : null,
        weeklyProgress: selectPlannerProgress(tasks)
    };
}
