const DAY_MS = 24 * 60 * 60 * 1000;
const SCHEDULING_DAYS = 7;

function dateKey(date) {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-");
}

function addDays(date, days) {
    const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    next.setDate(next.getDate() + days);
    return next;
}

function dateFromKey(value) {
    const date = new Date(`${value || ""}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
}

function durationFor(recommendation) {
    if (Number(recommendation.estimatedMinutes) > 0) {
        return Math.min(180, Math.max(10, recommendation.estimatedMinutes));
    }
    if (recommendation.type === "flashcards") return 40;
    if (recommendation.type === "quiz") return 30;
    if (recommendation.type === "resource") return 45;
    return 30;
}

function workloadByDate(tasks) {
    return tasks
        .filter((task) => !task.completed && task.dueDate)
        .reduce((workload, task) => {
            const current = workload.get(task.dueDate) || {
                deadlines: 0,
                minutes: 0
            };
            current.minutes += Math.max(0, Number(task.estimatedMinutes) || 0);
            if (task.priority === "High") current.deadlines += 1;
            workload.set(task.dueDate, current);
            return workload;
        }, new Map());
}

function priorityFor(recommendation, dueDate, now) {
    const deadline = dateFromKey(dueDate);
    const daysToDeadline = deadline
        ? Math.round(
              (deadline.getTime() -
                  new Date(
                      now.getFullYear(),
                      now.getMonth(),
                      now.getDate()
                  ).getTime()) /
                  DAY_MS
          )
        : 30;
    if (
        recommendation.weakTopic ||
        recommendation.type === "quiz" ||
        daysToDeadline <= 2
    ) {
        return "High";
    }
    return daysToDeadline <= 7 ? "Medium" : "Low";
}

export function suggestThutoStudySchedule(
    recommendation,
    plannerTasks = [],
    now = new Date()
) {
    const workload = workloadByDate(plannerTasks);
    const deadline = dateFromKey(recommendation.dueDate);
    const startOffset = now.getHours() >= 18 ? 1 : 0;
    const candidates = Array.from({ length: SCHEDULING_DAYS }, (_, index) => {
        const offset = index + startOffset;
        const date = addDays(now, offset);
        const key = dateKey(date);
        const dayWorkload = workload.get(key) || {
            deadlines: 0,
            minutes: 0
        };
        const afterDeadline = deadline && date > deadline;
        const weekend = [0, 6].includes(date.getDay());
        return {
            date,
            key,
            score:
                dayWorkload.minutes +
                dayWorkload.deadlines * 35 +
                (weekend ? 12 : 0) +
                offset * (recommendation.weakTopic ? 8 : 3) +
                (afterDeadline ? 500 : 0),
            workloadMinutes: dayWorkload.minutes
        };
    }).sort(
        (first, second) =>
            first.score - second.score || first.date - second.date
    );
    const selected = candidates[0];
    const estimatedMinutes = durationFor(recommendation);
    const dueDate = selected.key;
    const priority = priorityFor(recommendation, recommendation.dueDate, now);
    const lightDay = selected.workloadMinutes < 60;
    const advisoryReason = recommendation.dueDate
        ? `Suggested before the ${recommendation.dueDate} deadline on a ${lightDay ? "lighter" : "lower-load"} planner day.`
        : `Suggested on a ${lightDay ? "lighter" : "lower-load"} planner day with ${selected.workloadMinutes} existing minutes.`;

    return {
        advisoryReason,
        dueDate,
        estimatedMinutes,
        notes: `Recommended by Thuto: ${recommendation.reason}`.slice(0, 500),
        priority,
        subject: recommendation.subject || "General",
        taskType: recommendation.taskType || "study",
        title: recommendation.title,
        ...(recommendation.resourceId
            ? { resourceId: recommendation.resourceId }
            : {}),
        ...(recommendation.quizId ? { quizId: recommendation.quizId } : {}),
        ...(recommendation.flashcardDeckId
            ? { flashcardDeckId: recommendation.flashcardDeckId }
            : {})
    };
}

export { dateKey as thutoScheduleDateKey };
