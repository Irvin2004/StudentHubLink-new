import { renderDashboard } from "../renderers/dashboard-renderer.js?live=1";
import { getAssignmentStatus } from "../utils/assignment-status.js";

function asArray(value) {
    return Array.isArray(value) ? value : [];
}

function isUpcomingAssignment(assignment) {
    try {
        return getAssignmentStatus(assignment?.dueDate) !== "overdue";
    } catch {
        return false;
    }
}

function getUnreadMessageCount(conversations, userId) {
    return conversations.reduce((total, conversation) => {
        const value =
            conversation?.unreadCount ??
            conversation?.unreadCounts?.[userId] ??
            0;
        const unreadCount = Number(value);

        return (
            total +
            (Number.isFinite(unreadCount) ? Math.max(0, unreadCount) : 0)
        );
    }, 0);
}

export function createDashboardRefreshManager({
    data = {},
    elements = {},
    userId = ""
} = {}) {
    const state = {
        stats: { ...(data.stats || {}) },
        assignments: asArray(data.assignments),
        notifications: asArray(data.notifications),
        groups: asArray(data.groups),
        conversations: asArray(data.conversations)
    };

    function refreshStats(nextStats = {}) {
        state.stats = {
            ...state.stats,
            ...nextStats
        };
        renderDashboard({ stats: state.stats }, { stats: elements.stats });
    }

    function refreshAssignments(assignments) {
        state.assignments = asArray(assignments).filter(isUpcomingAssignment);
        state.stats.assignments = state.assignments.length;
        renderDashboard(
            {
                stats: state.stats,
                assignments: state.assignments
            },
            {
                stats: elements.stats,
                assignments: elements.assignments
            }
        );
    }

    function refreshNotifications(notifications) {
        state.notifications = asArray(notifications);
        state.stats.unreadNotifications = state.notifications.filter(
            (notification) => notification.read !== true
        ).length;
        renderDashboard(
            {
                stats: state.stats,
                notifications: state.notifications
            },
            {
                stats: elements.stats,
                notifications: elements.notifications
            }
        );
    }

    function refreshGroups(groups) {
        state.groups = asArray(groups);
        state.stats.groups = state.groups.length;
        renderDashboard(
            {
                stats: state.stats,
                groups: state.groups
            },
            {
                stats: elements.stats,
                groups: elements.groups
            }
        );
    }

    function refreshConversations(conversations) {
        state.conversations = asArray(conversations);
        state.stats.unreadMessages = getUnreadMessageCount(
            state.conversations,
            userId
        );
        refreshStats();
    }

    return Object.freeze({
        refreshStats,
        refreshAssignments,
        refreshNotifications,
        refreshGroups,
        refreshConversations
    });
}
