"use strict";

import { ACTIVITY_TYPES } from "../config/activity-types.js";
import { escapeHtml } from "../utils/dom.js";
import { toDate } from "../utils/format-date.js";
import { formatTimeAgo } from "../utils/time-ago.js";
import {
    hideSkeleton,
    showSkeleton
} from "./skeleton-renderer.js";
import {
    SKELETON_TYPES
} from "../config/skeleton-types.js";

const ACTIVITY_ICONS = Object.freeze({
    [ACTIVITY_TYPES.ASSIGNMENT_CREATED]: "📝",
    [ACTIVITY_TYPES.ASSIGNMENT_UPDATED]: "📝",
    [ACTIVITY_TYPES.RESOURCE_CREATED]: "📚",
    [ACTIVITY_TYPES.MESSAGE_SENT]: "💬",
    [ACTIVITY_TYPES.FRIEND_REQUEST_ACCEPTED]: "🤝",
    [ACTIVITY_TYPES.GROUP_CREATED]: "👥",
    [ACTIVITY_TYPES.GROUP_JOINED]: "👥",
    [ACTIVITY_TYPES.SYSTEM]: "ℹ️"
});

let renderSequence = 0;

function requireContainer(container) {
    if (!container || !("innerHTML" in container)) {
        throw new Error("Activity feed container is required.");
    }

    return container;
}

function isSameCalendarDate(firstDate, secondDate) {
    return (
        firstDate.getFullYear() === secondDate.getFullYear() &&
        firstDate.getMonth() === secondDate.getMonth() &&
        firstDate.getDate() === secondDate.getDate()
    );
}

function getDateLabel(value, now = new Date()) {
    const date = toDate(value);

    if (!date) {
        return "Recent";
    }

    if (isSameCalendarDate(date, now)) {
        return "Today";
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (isSameCalendarDate(date, yesterday)) {
        return "Yesterday";
    }

    return new Intl.DateTimeFormat("en-ZA", {
        day: "numeric",
        month: "long",
        year: "numeric"
    }).format(date);
}

function groupActivitiesByDate(activities) {
    return activities.reduce((groups, activity) => {
        const label = getDateLabel(activity.createdAt);

        if (!groups.has(label)) {
            groups.set(label, []);
        }

        groups.get(label).push(activity);
        return groups;
    }, new Map());
}

function getActivityIcon(type) {
    return ACTIVITY_ICONS[type] || ACTIVITY_ICONS[ACTIVITY_TYPES.SYSTEM];
}

function lowercaseFirst(value) {
    const text = String(value || "").trim();

    return text
        ? `${text.charAt(0).toLocaleLowerCase()}${text.slice(1)}`
        : "Activity update";
}

function renderActivity(activity = {}) {
    const actorName = String(activity.actorName || "").trim();
    const title = actorName
        ? `${actorName} ${lowercaseFirst(activity.title)}`
        : String(activity.title || "Activity update").trim();
    const description = String(activity.description || "").trim();
    const createdAt = toDate(activity.createdAt);
    const datetime = createdAt
        ? ` datetime="${escapeHtml(createdAt.toISOString())}"`
        : "";

    return `
        <li class="activity-item" data-activity-id="${escapeHtml(
            activity.id || ""
        )}">
            <span class="activity-icon" aria-hidden="true">
                ${getActivityIcon(activity.type)}
            </span>
            <div class="activity-content">
                <h4>${escapeHtml(title)}</h4>
                ${description ? `<p>${escapeHtml(description)}</p>` : ""}
                <time class="activity-time"${datetime}>
                    ${escapeHtml(formatTimeAgo(activity.createdAt))}
                </time>
            </div>
        </li>
    `;
}

function renderActivitySection(label, activities, sectionId) {
    const headingId = `${sectionId}-${String(label)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "recent"}`;

    return `
        <section class="activity-date-section" aria-labelledby="${headingId}">
            <h3 id="${headingId}" class="activity-date">
                ${escapeHtml(label)}
            </h3>
            <ol class="activity-list">
                ${activities.map(renderActivity).join("")}
            </ol>
        </section>
    `;
}

export function renderActivityFeed(activities = [], container) {
    const target = requireContainer(container);

    if (target.querySelector?.("[data-skeleton-root]")) {
        hideSkeleton(target);
    }

    if (!activities.length) {
        return renderActivityEmpty(target);
    }

    renderSequence += 1;
    const sectionId = `activityFeed${renderSequence}`;
    const groups = groupActivitiesByDate(activities);
    const html = `
        <div class="activity-feed">
            ${[...groups.entries()].map(([label, groupActivities]) =>
                renderActivitySection(label, groupActivities, sectionId)
            ).join("")}
        </div>
    `;

    target.setAttribute?.("aria-busy", "false");
    target.innerHTML = html;
    return html;
}

export function renderActivityLoading(container) {
    const target = requireContainer(container);
    showSkeleton(target, SKELETON_TYPES.NOTIFICATION);
    return target.innerHTML;
}

export function renderActivityEmpty(container) {
    const target = requireContainer(container);

    if (target.querySelector?.("[data-skeleton-root]")) {
        hideSkeleton(target);
    }

    const html = `
        <div class="activity-state activity-empty" role="status">
            <span class="activity-state-icon" aria-hidden="true">📭</span>
            <strong>No recent activity yet.</strong>
            <p>Activities from your groups will appear here.</p>
        </div>
    `;

    target.setAttribute?.("aria-busy", "false");
    target.innerHTML = html;
    return html;
}

export function renderActivityError(container) {
    const target = requireContainer(container);

    if (target.querySelector?.("[data-skeleton-root]")) {
        hideSkeleton(target);
    }
    const html = `
        <div class="activity-state activity-error" role="alert">
            <span class="activity-state-icon" aria-hidden="true">⚠️</span>
            <strong>Unable to load activity.</strong>
            <p>Please try again later.</p>
        </div>
    `;

    target.setAttribute?.("aria-busy", "false");
    target.innerHTML = html;
    return html;
}
