import { getAssignmentStatus } from "../utils/assignment-status.js";
import { escapeHtml } from "../utils/dom.js";
import { formatDate } from "../utils/format-date.js";

const STATUS_DETAILS = Object.freeze({
    upcoming: {
        icon: "&#128994;",
        label: "Upcoming"
    },
    today: {
        icon: "&#128993;",
        label: "Due Today"
    },
    overdue: {
        icon: "&#128308;",
        label: "Overdue"
    }
});

export function renderAssignmentCard(assignment) {
    const status = getAssignmentStatus(assignment.dueDate);
    const statusDetails = STATUS_DETAILS[status];
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

                <span class="assignment-status is-${status}">
                    <span aria-hidden="true">${statusDetails.icon}</span>
                    ${statusDetails.label}
                </span>
            </header>

            <footer class="assignment-footer">
                <div class="assignment-meta">
                    <span>
                        <span aria-hidden="true">&#128197;</span>
                        Due: ${escapeHtml(dueDate)}
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
                        class="btn btn-secondary"
                        type="button"
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

    const assignmentList = Array.isArray(assignments)
        ? assignments
        : [];

    container.innerHTML = assignmentList.length
        ? assignmentList.map(renderAssignmentCard).join("")
        : `
            <div class="assignment-empty-state">
                <span aria-hidden="true">&#128218;</span>
                <h2>No assignments yet.</h2>
                <p>Be the first to create one.</p>
                <button
                    class="btn btn-primary"
                    type="button"
                    data-assignment-create>
                    + New Assignment
                </button>
            </div>
        `;
}
