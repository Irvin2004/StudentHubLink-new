import { getAssignmentStatus } from "./assignment-status.js";
import { getTimestampMillis } from "./format-date.js";

const STATUS_PRIORITY = Object.freeze({
    today: 0,
    upcoming: 1,
    overdue: 2
});

export function sortAssignments(assignments, now = new Date()) {
    const assignmentList = Array.isArray(assignments)
        ? assignments
        : [];

    return [...assignmentList].sort((first, second) => {
        const firstStatus = getAssignmentStatus(first.dueDate, now);
        const secondStatus = getAssignmentStatus(second.dueDate, now);
        const statusDifference =
            STATUS_PRIORITY[firstStatus] - STATUS_PRIORITY[secondStatus];

        if (statusDifference !== 0) {
            return statusDifference;
        }

        const firstDueDate = getTimestampMillis(first.dueDate);
        const secondDueDate = getTimestampMillis(second.dueDate);

        return firstStatus === "overdue"
            ? secondDueDate - firstDueDate
            : firstDueDate - secondDueDate;
    });
}
