"use strict";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

import { auth } from "../firebase.js";
import { renderDashboard } from "../renderers/dashboard-renderer.js";
import { getDashboardData } from "../services/dashboard-service.js";
import { getUserFriendlyErrorMessage } from "../utils/error-handler.js";
import { error as logError } from "../utils/logger.js";

let currentUser = null;
let loadSequence = 0;
let destroyed = false;
let unsubscribeAuth = () => {};

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
        groups: getRequiredElement("dashboardGroups")
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

    const destroy = () => {
        if (destroyed) {
            return;
        }

        destroyed = true;
        loadSequence += 1;
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
