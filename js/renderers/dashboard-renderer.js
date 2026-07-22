import { renderNotifications } from "./notification-renderer.js";
import { getRelativeDueDate } from "../utils/assignment-due-date.js";
import { escapeHtml } from "../utils/dom.js";
import { getTimestampMillis, toDate } from "../utils/format-date.js";

const STAT_CARDS = Object.freeze([
    {
        icon: "&#128101;",
        key: "groups",
        link: "./groups.html",
        title: "Groups"
    },
    {
        icon: "&#128101;",
        key: "friends",
        link: "./profile.html",
        title: "Friends"
    },
    {
        icon: "&#128221;",
        key: "assignments",
        link: "./groups.html",
        title: "Assignments"
    },
    {
        icon: "&#128276;",
        key: "unreadNotifications",
        link: "#dashboardNotifications",
        title: "Notifications"
    }
]);

function requireContainer(container, name) {
    if (!container || !("innerHTML" in container)) {
        throw new Error(`${name} container is required.`);
    }

    return container;
}

function createEmptyState({
    icon,
    title,
    message = ""
}) {
    return `
        <div class="dashboard-empty-state">
            <span aria-hidden="true">${icon}</span>
            <strong>${escapeHtml(title)}</strong>
            ${message ? `<p>${escapeHtml(message)}</p>` : ""}
        </div>
    `;
}

function createStatCard({
    icon,
    title,
    value,
    link
}) {
    const numericValue = Number(value);
    const displayValue = Number.isFinite(numericValue)
        ? Math.max(0, numericValue)
        : 0;

    return `
        <a
            class="dashboard-stat-card"
            href="${escapeHtml(link)}"
            aria-label="${escapeHtml(`${title}: ${displayValue}`)}">
            <span class="dashboard-stat-icon" aria-hidden="true">
                ${icon}
            </span>
            <span class="dashboard-stat-title">${escapeHtml(title)}</span>
            <strong>${displayValue}</strong>
        </a>
    `;
}

function renderStats(stats = {}, container) {
    const target = requireContainer(container, "Statistics");

    target.innerHTML = STAT_CARDS.map((card) =>
        createStatCard({
            ...card,
            value: stats?.[card.key]
        })
    ).join("");
}

function sortByDueDate(assignments) {
    return [...assignments].sort((first, second) => {
        const firstTimestamp = getTimestampMillis(first?.dueDate);
        const secondTimestamp = getTimestampMillis(second?.dueDate);

        if (!firstTimestamp && !secondTimestamp) return 0;
        if (!firstTimestamp) return 1;
        if (!secondTimestamp) return -1;

        return firstTimestamp - secondTimestamp;
    });
}

function createAssignmentItem(assignment = {}) {
    const dueDate = toDate(assignment.dueDate);
    const dateAttribute = dueDate
        ? ` datetime="${escapeHtml(dueDate.toISOString())}"`
        : "";

    return `
        <article
            class="dashboard-list-item dashboard-assignment-item"
            data-assignment-id="${escapeHtml(assignment.id || "")}">
            <span class="dashboard-list-icon" aria-hidden="true">
                &#128221;
            </span>
            <div class="dashboard-list-content">
                <strong>${escapeHtml(
                    assignment.title || "Untitled assignment"
                )}</strong>
                <time${dateAttribute}>
                    ${escapeHtml(getRelativeDueDate(assignment.dueDate))}
                </time>
            </div>
        </article>
    `;
}

function renderAssignments(assignments, container) {
    const target = requireContainer(container, "Assignments");
    const assignmentList = Array.isArray(assignments)
        ? sortByDueDate(assignments)
        : [];

    target.innerHTML = assignmentList.length
        ? assignmentList.map(createAssignmentItem).join("")
        : createEmptyState({
            icon: "&#128221;",
            title: "No upcoming assignments."
        });
}

function renderDashboardNotifications(notifications, container) {
    requireContainer(container, "Notifications");
    renderNotifications(
        Array.isArray(notifications) ? notifications : [],
        container
    );
}

function createGroupItem(group = {}) {
    const groupId = String(group.id || "");
    const memberCount = Number(group.memberCount || 0);
    const safeMemberCount = Number.isFinite(memberCount)
        ? Math.max(0, memberCount)
        : 0;

    return `
        <article
            class="dashboard-list-item dashboard-group-item"
            data-group-id="${escapeHtml(groupId)}">
            <span class="dashboard-list-icon" aria-hidden="true">
                &#129302;
            </span>
            <div class="dashboard-list-content">
                <strong>${escapeHtml(group.name || "Study group")}</strong>
                <span>
                    ${safeMemberCount} member${safeMemberCount === 1 ? "" : "s"}
                </span>
            </div>
            <a
                href="./group-details.html?id=${escapeHtml(
                    encodeURIComponent(groupId)
                )}"
                aria-label="View ${escapeHtml(group.name || "study group")}">
                View <span aria-hidden="true">&rarr;</span>
            </a>
        </article>
    `;
}

function renderGroups(groups, container) {
    const target = requireContainer(container, "Groups");
    const groupList = Array.isArray(groups) ? groups : [];

    target.innerHTML = groupList.length
        ? groupList.map(createGroupItem).join("")
        : createEmptyState({
            icon: "&#128101;",
            title: "You haven't joined any groups yet."
        });
}

export function renderDashboard(data = {}, elements = {}) {
    renderStats(data.stats, elements.stats);
    renderAssignments(data.assignments, elements.assignments);
    renderDashboardNotifications(
        data.notifications,
        elements.notifications
    );
    renderGroups(data.groups, elements.groups);
}
