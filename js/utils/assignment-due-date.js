import { toDate } from "./format-date.js";

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

function startOfDay(value) {
    const date = toDate(value);

    if (!date) {
        return null;
    }

    date.setHours(0, 0, 0, 0);
    return date;
}

export function getRelativeDueDate(dueDate, now = new Date()) {
    const due = startOfDay(dueDate);
    const today = startOfDay(now);

    if (!due || !today) {
        return "Due date unavailable";
    }

    const days = Math.round(
        (due.getTime() - today.getTime()) / DAY_IN_MILLISECONDS
    );

    if (days === 0) {
        return "Due today";
    }

    if (days === 1) {
        return "Due tomorrow";
    }

    if (days > 1) {
        return `Due in ${days} days`;
    }

    if (days === -1) {
        return "1 day overdue";
    }

    return `${Math.abs(days)} days overdue`;
}
