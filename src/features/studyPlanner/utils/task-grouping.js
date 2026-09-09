export const TASK_GROUPS = Object.freeze([
    { id: "overdue", label: "Overdue" },
    { id: "today", label: "Today" },
    { id: "tomorrow", label: "Tomorrow" },
    { id: "week", label: "This Week" },
    { id: "later", label: "Later" },
    { id: "completed", label: "Completed" }
]);

export function getDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

export function isDateKey(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;

    const [year, month, day] = String(value).split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
}

export function getDueGroup(dueDate, today = new Date(), completed = false) {
    if (!isDateKey(dueDate)) return completed ? "completed" : "later";

    const todayKey = getDateKey(today);
    if (dueDate < todayKey) return completed ? "completed" : "overdue";
    if (dueDate === todayKey) return "today";

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (dueDate === getDateKey(tomorrow)) return "tomorrow";

    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + ((7 - endOfWeek.getDay()) % 7));
    if (dueDate <= getDateKey(endOfWeek)) return "week";

    return "later";
}

export function getDueLabel(dueGroup) {
    return TASK_GROUPS.find((group) => group.id === dueGroup)?.label || "Later";
}

export function getDueStatusLabel(dueDate, today = new Date()) {
    if (!isDateKey(dueDate)) return "No due date";

    const [dueYear, dueMonth, dueDay] = String(dueDate).split("-").map(Number);
    const dueTime = Date.UTC(dueYear, dueMonth - 1, dueDay);
    const todayTime = Date.UTC(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
    );
    const daysUntilDue = Math.round((dueTime - todayTime) / 86_400_000);

    if (daysUntilDue === 0) return "Due today";
    if (daysUntilDue === 1) return "Due tomorrow";
    if (daysUntilDue > 1) {
        return `Due in ${daysUntilDue} days`;
    }

    const overdueDays = Math.abs(daysUntilDue);
    return `${overdueDays} ${overdueDays === 1 ? "day" : "days"} overdue`;
}

export function formatStudyTime(minutes) {
    const safeMinutes = Math.max(0, Math.round(Number(minutes) || 0));
    const hours = Math.floor(safeMinutes / 60);
    const remainingMinutes = safeMinutes % 60;

    if (!hours) return `${remainingMinutes}m`;
    if (!remainingMinutes) return `${hours}h`;
    return `${hours}h ${remainingMinutes}m`;
}

export function sortTasksByDueDate(tasks) {
    return [...tasks].sort((firstTask, secondTask) =>
        String(firstTask.dueDate || "9999-12-31").localeCompare(
            String(secondTask.dueDate || "9999-12-31")
        )
    );
}
