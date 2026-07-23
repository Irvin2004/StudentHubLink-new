import { getAssignments } from "./assignment-service.js";
import { getStudyGroupMemberships, getStudyGroups } from "./group-service.js";
import { getNotifications } from "./notification-service.js";
import { getAssignmentStatus } from "../utils/assignment-status.js";
import { log } from "../utils/logger.js";

function validateUserId(userId) {
    const cleanUserId = typeof userId === "string" ? userId.trim() : "";

    if (!cleanUserId) {
        throw new Error("User ID is required.");
    }

    return cleanUserId;
}

async function getUserGroups(userId) {
    const groups = await getStudyGroups();
    const groupIds = groups.map((group) => group.id);
    const memberships = await getStudyGroupMemberships(groupIds, userId);

    return groups.filter((group) => memberships.has(group.id));
}

function isUpcomingAssignment(assignment) {
    try {
        return getAssignmentStatus(assignment?.dueDate) !== "overdue";
    } catch {
        return false;
    }
}

async function getUpcomingAssignments(groups) {
    if (!groups.length) {
        return [];
    }

    const assignmentLists = await Promise.all(
        groups.map((group) => getAssignments(group.id))
    );

    return assignmentLists.flat().filter(isUpcomingAssignment);
}

async function loadWidget(name, loader) {
    try {
        const result = await loader();
        return Array.isArray(result) ? result : [];
    } catch (error) {
        log("DASHBOARD", `${name} widget is unavailable:`, error);
        return [];
    }
}

function getUnreadMessageCount(conversations) {
    return conversations.reduce((total, conversation) => {
        const unreadCount = Number(conversation?.unreadCount || 0);

        return (
            total +
            (Number.isFinite(unreadCount) ? Math.max(0, unreadCount) : 0)
        );
    }, 0);
}

export async function getDashboardData(userId) {
    const cleanUserId = validateUserId(userId);
    const groupsPromise = loadWidget("Groups", () =>
        getUserGroups(cleanUserId)
    );
    const assignmentsPromise = groupsPromise.then((groups) =>
        loadWidget("Assignments", () => getUpcomingAssignments(groups))
    );

    const [groups, assignments, notifications] = await Promise.all([
        groupsPromise,
        assignmentsPromise,
        loadWidget("Notifications", () => getNotifications(cleanUserId))
    ]);

    /*
     * These widgets remain optional until their owning services expose
     * one-time read APIs. Keeping them here preserves the dashboard contract
     * without duplicating Firestore queries or leaking live subscriptions.
     */
    const friends = [];
    const conversations = [];
    const activity = [];
    const upcomingEvents = [];

    return {
        stats: {
            groups: groups.length,
            friends: friends.length,
            assignments: assignments.length,
            unreadNotifications: notifications.filter(
                (notification) => notification.read !== true
            ).length,
            unreadMessages: getUnreadMessageCount(conversations)
        },
        assignments,
        notifications,
        groups,
        friends,
        conversations,
        activity,
        upcomingEvents
    };
}
