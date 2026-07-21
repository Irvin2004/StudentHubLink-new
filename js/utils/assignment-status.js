import { toDate } from "./format-date.js";

export function getAssignmentStatus(dueDate, now = new Date()) {
    const due = toDate(dueDate);
    const today = toDate(now);

    if (!due || !today) {
        throw new Error("Invalid assignment due date.");
    }

    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (due.getTime() < today.getTime()) {
        return "overdue";
    }

    if (due.getTime() === today.getTime()) {
        return "today";
    }

    return "upcoming";
}
