"use strict";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

import { auth } from "../firebase.js";
import { initializeActivityFeed } from
    "./activity-controller.js?activity-feed=1";
import { createDashboardRefreshManager } from "./dashboard-refresh.js?live=1";
import { initialiseSearch } from "./search-controller.js?global-search=1";
import { renderDashboard } from "../renderers/dashboard-renderer.js?live=1";
import { subscribeToAssignments } from "../services/assignment-service.js?dashboard-live=1";
import { subscribeToUserConversations } from "../services/conversation-service.js?dashboard-live=1";
import { getDashboardData } from "../services/dashboard-service.js";
import { subscribeToUserStudyGroups } from "../services/group-service.js?dashboard-live=1";
import { subscribeToNotifications } from "../services/notification-service.js";
import { getUserFriendlyErrorMessage } from "../utils/error-handler.js";
import { error as logError, log } from "../utils/logger.js";

let currentUser = null;
let loadSequence = 0;
let destroyed = false;
let unsubscribeAuth = () => {};
let stopLiveUpdates = () => {};
let stopSearch = () => {};
let activityFeedController = { destroy() {} };

function getRequiredElement(id) {
    const element = document.getElementById(id);

    if (!element) {
        throw new Error(`Dashboard element #${id} is required.`);
    }

    return element;
}

function getDashboardElements() {
    return {
        page: document.querySelector(".dashboard-page"),
        loading: getRequiredElement("dashboardLoadingState"),
        error: getRequiredElement("dashboardErrorState"),
        errorMessage: getRequiredElement("dashboardErrorMessage"),
        content: getRequiredElement("dashboardContent"),
        greeting: getRequiredElement("dashboardGreeting"),
        date: getRequiredElement("dashboardDate"),
        retryButton: getRequiredElement("retryDashboardButton"),
        refreshButton: getRequiredElement("refreshDashboardButton"),
        stats: getRequiredElement("dashboardStats"),
        assignments: getRequiredElement("dashboardAssignments"),
        notifications: getRequiredElement("dashboardNotifications"),
        groups: getRequiredElement("dashboardGroups"),
        activity: getRequiredElement("activityFeed"),
        searchInput: getRequiredElement("globalSearchInput"),
        searchDropdown: getRequiredElement("searchDropdown")
    };
}

function setViewState(elements, state) {
    elements.loading.hidden = state !== "loading";
    elements.error.hidden = state !== "error";
    elements.content.hidden = state !== "success";

    elements.page?.setAttribute(
        "aria-busy",
        String(state === "loading")
    );
}

function setRefreshState(button, isLoading) {
    button.disabled = isLoading;
    button.classList.toggle("is-loading", isLoading);
    button.setAttribute("aria-busy", String(isLoading));
}

function updateDashboardIdentity(user, elements) {
    const displayName = String(
        user.displayName || user.email?.split("@")[0] || ""
    ).trim();
    const firstName = displayName.split(/\s+/)[0];

    elements.greeting.textContent = firstName
        ? `Welcome back, ${firstName}`
        : "Welcome back";
    elements.date.dateTime = new Date().toISOString();
    elements.date.textContent = new Intl.DateTimeFormat("en-ZA", {
        weekday: "long",
        day: "numeric",
        month: "long"
    }).format(new Date());
}

function startLiveDashboardUpdates({
    userId,
    groups,
    assignments,
    refreshManager
}) {
    const subscriptions = [];
    const assignmentSubscriptions = new Map();
    const assignmentsByGroup = new Map();
    let stopped = false;

    asAssignmentGroups(assignments).forEach((groupAssignments, groupId) => {
        assignmentsByGroup.set(groupId, groupAssignments);
    });

    const reportError = (widget, error) => {
        log("DASHBOARD", `${widget} live update failed:`, error);
    };

    const refreshAllAssignments = () => {
        refreshManager.refreshAssignments(
            [...assignmentsByGroup.values()].flat()
        );
    };

    const syncAssignmentSubscriptions = (nextGroups) => {
        const nextGroupIds = new Set(
            nextGroups.map((group) => group.id).filter(Boolean)
        );

        assignmentSubscriptions.forEach((unsubscribe, groupId) => {
            if (nextGroupIds.has(groupId)) {
                return;
            }

            unsubscribe();
            assignmentSubscriptions.delete(groupId);
            assignmentsByGroup.delete(groupId);
        });

        nextGroupIds.forEach((groupId) => {
            if (assignmentSubscriptions.has(groupId)) {
                return;
            }

            try {
                const unsubscribe = subscribeToAssignments(
                    groupId,
                    (nextAssignments) => {
                        if (stopped) return;
                        assignmentsByGroup.set(groupId, nextAssignments);
                        refreshAllAssignments();
                    },
                    (error) => reportError("Assignments", error)
                );
                assignmentSubscriptions.set(groupId, unsubscribe);
            } catch (error) {
                reportError("Assignments", error);
            }
        });

        refreshAllAssignments();
    };

    const subscribeSafely = (widget, subscribe) => {
        try {
            const unsubscribe = subscribe();

            if (typeof unsubscribe === "function") {
                subscriptions.push(unsubscribe);
            }
        } catch (error) {
            reportError(widget, error);
        }
    };

    syncAssignmentSubscriptions(groups);

    subscribeSafely("Notifications", () =>
        subscribeToNotifications(
            userId,
            (notifications) => {
                if (!stopped) {
                    refreshManager.refreshNotifications(notifications);
                }
            },
            (error) => reportError("Notifications", error)
        )
    );

    subscribeSafely("Messages", () =>
        subscribeToUserConversations(
            userId,
            (conversations) => {
                if (!stopped) {
                    refreshManager.refreshConversations(conversations);
                }
            },
            (error) => reportError("Messages", error)
        )
    );

    subscribeSafely("Groups", () =>
        subscribeToUserStudyGroups(
            userId,
            (nextGroups) => {
                if (stopped) return;
                refreshManager.refreshGroups(nextGroups);
                syncAssignmentSubscriptions(nextGroups);
            },
            (error) => reportError("Groups", error)
        )
    );

    return () => {
        if (stopped) return;

        stopped = true;
        subscriptions.forEach((unsubscribe) => unsubscribe());
        assignmentSubscriptions.forEach((unsubscribe) => unsubscribe());
        subscriptions.length = 0;
        assignmentSubscriptions.clear();
        assignmentsByGroup.clear();
    };
}

function asAssignmentGroups(assignments) {
    const groupedAssignments = new Map();

    (Array.isArray(assignments) ? assignments : []).forEach((assignment) => {
        const groupId = assignment?.groupId;

        if (!groupId) return;

        const groupAssignments = groupedAssignments.get(groupId) || [];
        groupAssignments.push(assignment);
        groupedAssignments.set(groupId, groupAssignments);
    });

    return groupedAssignments;
}

async function loadDashboard(elements, {
    preserveContent = false
} = {}) {
    if (!currentUser || destroyed) {
        return;
    }

    const requestId = ++loadSequence;

    if (preserveContent) {
        elements.loading.hidden = true;
        elements.error.hidden = true;
        elements.content.hidden = false;
        elements.page?.setAttribute("aria-busy", "true");
    } else {
        setViewState(elements, "loading");
    }

    setRefreshState(elements.refreshButton, true);

    try {
        const dashboardData = await getDashboardData(currentUser.uid);

        if (destroyed || requestId !== loadSequence) {
            return;
        }

        renderDashboard(dashboardData, elements);
        activityFeedController.destroy();
        activityFeedController = initializeActivityFeed({
            container: elements.activity,
            groupId: dashboardData.groups[0]?.id
        });
        stopLiveUpdates();
        const refreshManager = createDashboardRefreshManager({
            data: dashboardData,
            elements,
            userId: currentUser.uid
        });
        stopLiveUpdates = startLiveDashboardUpdates({
            userId: currentUser.uid,
            groups: dashboardData.groups,
            assignments: dashboardData.assignments,
            refreshManager
        });
        setViewState(elements, "success");
    } catch (error) {
        if (destroyed || requestId !== loadSequence) {
            return;
        }

        logError("DASHBOARD", "Dashboard loading failed:", error);
        elements.errorMessage.textContent = getUserFriendlyErrorMessage(
            error,
            "Please check your connection and try again."
        );
        setViewState(elements, "error");
    } finally {
        if (!destroyed && requestId === loadSequence) {
            setRefreshState(elements.refreshButton, false);
        }
    }
}

async function initialiseDashboard() {
    const elements = getDashboardElements();
    const refresh = () => loadDashboard(elements, {
        preserveContent: !elements.content.hidden
    });

    elements.retryButton.addEventListener("click", refresh);
    elements.refreshButton.addEventListener("click", refresh);
    stopSearch = initialiseSearch({
        input: elements.searchInput,
        dropdown: elements.searchDropdown
    });

    const destroy = () => {
        if (destroyed) {
            return;
        }

        destroyed = true;
        loadSequence += 1;
        stopLiveUpdates();
        stopSearch();
        activityFeedController.destroy();
        unsubscribeAuth();
        elements.retryButton.removeEventListener("click", refresh);
        elements.refreshButton.removeEventListener("click", refresh);
        window.removeEventListener("pagehide", destroy);
    };

    window.addEventListener("pagehide", destroy, { once: true });

    unsubscribeAuth = onAuthStateChanged(
        auth,
        (user) => {
            if (!user) {
                currentUser = null;
                window.location.replace("../login.html");
                return;
            }

            stopLiveUpdates();
            stopLiveUpdates = () => {};
            currentUser = user;
            updateDashboardIdentity(user, elements);
            loadDashboard(elements);
        },
        (error) => {
            logError(
                "DASHBOARD",
                "Authentication state could not be loaded:",
                error
            );
            elements.errorMessage.textContent =
                getUserFriendlyErrorMessage(
                    error,
                    "We couldn't verify your account. Please try again."
                );
            setViewState(elements, "error");
        }
    );
}

document.addEventListener("DOMContentLoaded", initialiseDashboard);

window.addEventListener("pageshow", (event) => {
    if (!event.persisted || !destroyed) {
        return;
    }

    destroyed = false;
    currentUser = null;
    unsubscribeAuth = () => {};
    stopLiveUpdates = () => {};
    stopSearch = () => {};
    activityFeedController = { destroy() {} };
    initialiseDashboard();
});
