import { getAssignmentStatus } from "../utils/assignment-status.js";
import { getRelativeDueDate } from "../utils/assignment-due-date.js";
import { escapeHtml } from "../utils/dom.js";
import { formatDate } from "../utils/format-date.js";
import { sortAssignments } from "../utils/sort-assignments.js";

const STATUS_DETAILS = Object.freeze({
    upcoming: {
        label: "Upcoming",
        badgeClass: "badge-primary"
    },
    today: {
        label: "Due Today",
        badgeClass: "badge-warning"
    },
    overdue: {
        label: "Overdue",
        badgeClass: "badge-danger"
    }
});

export function renderAssignmentCard(assignment) {
    const status = getAssignmentStatus(assignment.dueDate);
    const statusDetails = STATUS_DETAILS[status];
    const relativeDueDate = getRelativeDueDate(assignment.dueDate);
    const dueDate = formatDate(assignment.dueDate, {
        fallback: "Date unavailable",
        locale: "en-GB",
        options: {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    });

    return `
        <article
            class="assignment-card"
            data-assignment-id="${escapeHtml(assignment.id)}">
            <header class="assignment-header">
                <div>
                    <h3>
                        <span aria-hidden="true">&#128218;</span>
                        ${escapeHtml(assignment.title)}
                    </h3>
                    ${assignment.description ? `
                        <p>${escapeHtml(assignment.description)}</p>
                    ` : ""}
                </div>

                <span class="badge assignment-status ${statusDetails.badgeClass}">
                    ${statusDetails.label}
                </span>
            </header>

            <footer class="assignment-footer">
                <div class="assignment-meta">
                    <span class="assignment-due-date" title="Due ${escapeHtml(dueDate)}">
                        <span aria-hidden="true">&#128197;</span>
                        <strong>${escapeHtml(relativeDueDate)}</strong>
                        <span class="assignment-due-date-exact">
                            <span aria-hidden="true">&middot;</span>
                            ${escapeHtml(dueDate)}
                        </span>
                    </span>
                    <span>
                        <span aria-hidden="true">&#128100;</span>
                        Created by ${escapeHtml(
                            assignment.creatorName || "Student"
                        )}
                    </span>
                </div>

                <div class="assignment-actions">
                    <button
                        class="btn btn-secondary"
                        type="button"
                        data-assignment-action="edit"
                        aria-label="Edit ${escapeHtml(assignment.title)}">
                        <span aria-hidden="true">&#9998;</span>
                        Edit
                    </button>
                    <button
                        class="btn btn-secondary assignment-delete"
                        type="button"
                        data-assignment-id="${escapeHtml(assignment.id)}"
                        data-assignment-action="delete"
                        aria-label="Delete ${escapeHtml(assignment.title)}">
                        <span aria-hidden="true">&#128465;</span>
                        Delete
                    </button>
                </div>
            </footer>
        </article>
    `;
}

export function renderAssignments(assignments, container) {
    if (!container) {
        throw new Error("Assignments container is required.");
    }

    const assignmentList = sortAssignments(assignments);

    container.innerHTML = assignmentList.length
        ? assignmentList.map(renderAssignmentCard).join("")
        : `
            <div class="assignment-empty-state">
                <span aria-hidden="true">&#128218;</span>
                <h2>No assignments yet</h2>
                <p>Assignments help your group stay organised.</p>
                <button
                    class="btn btn-primary"
                    type="button"
                    data-assignment-create>
                    Create Assignment
                </button>
            </div>
        `;
}
