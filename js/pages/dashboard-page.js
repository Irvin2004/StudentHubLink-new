import { getMonthlyUploads } from "../services/analytics-service.js";

import {
    onAuthStateChanged,
    signOut
}
from
"https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

import {
    collection,
    getCountFromServer,
    getDocs,
    limit,
    orderBy,
    query,
    where
}
from
"https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import { auth, db } from "../firebase/firebase-config.js";
import { getUserDocument } from "./auth-page.js";
import { mountNotificationPanel } from "../components/notification-panel.js";
import { escapeHtml, setText } from "../utils/dom.js";
import { formatDate, getTimestampMillis } from "../utils/format-date.js";
import { formatCurrency } from "../utils/format-price.js";
import { showSkeleton } from "../renderers/skeleton-renderer.js";
import { SKELETON_TYPES } from "../config/skeleton-types.js";
import { error as logError, warn } from "../utils/logger.js";
import {
    setUserOffline
} from "../services/presence-service.js";
import { createStudyGroup } from "../services/group-service.js";
import {
    handleError,
    showToast
} from "../services/user-feedback-service.js";

function setupCreateGroupModal() {
    const openButton =
    document.getElementById("openCreateGroup");

    const modal =
    document.getElementById("createGroupModal");

    const form =
    document.getElementById("createGroupForm");

    const cancelButton =
    document.getElementById("cancelGroup");

    if (!openButton || !modal || !form || !cancelButton) {
        return;
    }

    const closeModal = () => {
        modal.classList.add("hidden");
        form.reset();
        openButton.focus();
    };

    openButton.addEventListener("click", () => {
        modal.classList.remove("hidden");
        document.getElementById("groupName")?.focus();
    });

    if (window.location.hash === "#createGroupModal") {
        openButton.click();
    }

    cancelButton.addEventListener("click", closeModal);

    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (
            event.key === "Escape" &&
            !modal.classList.contains("hidden")
        ) {
            closeModal();
        }
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const owner = auth.currentUser;
        const submitButton =
        form.querySelector('button[type="submit"]');

        if (!owner) {
            showToast(
                "Sign in before creating a group.",
                "error"
            );
            return;
        }

        try {
            submitButton.disabled = true;
            submitButton.textContent = "Creating...";

            await createStudyGroup({
                name:
                    document.getElementById("groupName").value,
                moduleName:
                    document.getElementById("moduleName").value,
                moduleCode:
                    document.getElementById("moduleCode").value,
                description:
                    document.getElementById("groupDescription").value,
                tags:
                    document.getElementById("groupTags").value,
                visibility:
                    document.getElementById("groupVisibility").value,
                owner
            });

            closeModal();
            showToast(
                "Study group created.",
                "success"
            );
        } catch (error) {
            handleError(
                error,
                "Unable to create the study group."
            );
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Create Group";
        }
    });
}
function getGreeting(name) {
    const hour =
    new Date().getHours();

    if (hour < 12) {
        return `Good morning, ${name}`;
    }

    if (hour < 18) {
        return `Good afternoon, ${name}`;
    }

    return `Good evening, ${name}`;
}

function getActivityIcon(icon) {
    const icons = {
        "user-plus": "+",
        "upload": "UP",
        "approval": "OK",
        "sale": "R",
        "download": "DL",
        "info": "i"
    };

    return icons[icon] || "i";
}

function setupProfileMenu() {
    const profileButton =
    document.getElementById("profileButton");

    const profileDropdown =
    document.getElementById("profileDropdown");

    if (profileButton && profileDropdown) {
        profileButton.addEventListener("click", (event) => {
            event.stopPropagation();
            profileDropdown.classList.toggle("show");
        });
    }

    window.addEventListener("click", (event) => {
        if (
            profileButton &&
            profileDropdown &&
            !profileButton.contains(event.target) &&
            !profileDropdown.contains(event.target)
        ) {
            profileDropdown.classList.remove("show");
        }
    });
}

function setupLogout() {
    const logoutBtn =
    document.getElementById("logoutBtn");

    if (!logoutBtn) {
        return;
    }

    logoutBtn.addEventListener("click", async (event) => {
        event.preventDefault();

        if (auth.currentUser) {
            try {
                await setUserOffline(auth.currentUser.uid);
            } catch (error) {
                warn("PRESENCE", "Could not update offline status:", error);
            }
        }

        await signOut(auth);

        window.location.href =
        "login.html";
    });
}

async function loadDashboard(user) {
    const userData =
    await loadUserProfile(user);

    renderDashboard({
        userData,
        stats: null,
        activities: null,
        recentlyAdded: null,
        chart: null
    });

    showDashboardLoading();

    const stats =
    await loadStats(user, userData);

    const activities =
    await loadActivities();

    const recentlyAdded =
    await loadRecentlyAdded();

    const chart =
    await loadChart(user);

    renderDashboard({
        userData,
        stats,
        activities,
        recentlyAdded,
        chart
    });
}

async function loadStats(user, userData) {
    let uploadCount =
    Number(userData.totalUploads || 0);

    try {
        const uploadQuery =
        query(collection(db, "resources"), where("ownerId", "==", user.uid));

        const uploadSnapshot =
        await getCountFromServer(uploadQuery);

        uploadCount =
        uploadSnapshot.data().count;
    } catch (error) {
        warn("FIRESTORE", "Could not load dashboard upload count:", error);
    }

    return {
        uploads: uploadCount,
        downloads: Number(userData.totalDownloads || 0),
        earnings: Number(userData.totalEarnings || 0)
    };
}

async function loadUserProfile(user) {
    try {
        return await getUserDocument(user);
    } catch (error) {
        logError("AUTH", "Could not load dashboard profile:", error);

        return {
            name: user.displayName || "Student",
            fullName: user.displayName || "Student",
            email: user.email,
            totalUploads: 0,
            totalDownloads: 0,
            totalEarnings: 0
        };
    }
}

async function loadActivities() {
    showSkeleton(
        document.getElementById("recentActivityList"),
        SKELETON_TYPES.NOTIFICATION,
        { count: 3 }
    );

    return [];
}

async function loadRecentlyAdded() {
    showSkeleton(
        document.getElementById("recentlyAddedList"),
        SKELETON_TYPES.FILE,
        { count: 3 }
    );

    const approvedResourcesQuery =
    query(
        collection(db, "resources"),
        where("status", "==", "approved"),
        orderBy("createdAt", "desc"),
        limit(3)
    );

    try {
        const snapshot =
        await getDocs(approvedResourcesQuery);

        return snapshot.docs.map((resourceDoc) => ({
            id: resourceDoc.id,
            ...resourceDoc.data()
        }));
    } catch (error) {
        warn("FIRESTORE", "Ordered recently added query failed, retrying without orderBy:", error);
    }

    const fallbackQuery =
    query(
        collection(db, "resources"),
        where("status", "==", "approved")
    );

    const snapshot =
    await getDocs(fallbackQuery);

    return snapshot.docs
        .map((resourceDoc) => ({
            id: resourceDoc.id,
            ...resourceDoc.data()
        }))
        .sort((firstResource, secondResource) =>
            getTimestampMillis(secondResource.createdAt) -
            getTimestampMillis(firstResource.createdAt)
        )
        .slice(0, 3);
}

async function loadChart(user) {
    showChartSkeleton();

    try {
        return await getMonthlyUploads(user.uid);
    } catch (error) {
        logError("FIRESTORE", "Failed to load analytics:", error);

        return {
            labels: [
                "Jan","Feb","Mar","Apr","May","Jun",
                "Jul","Aug","Sep","Oct","Nov","Dec"
            ],
            values: new Array(12).fill(0)
        };
    }
}

function showDashboardLoading() {
    showStatSkeleton("totalUploads");
    showStatSkeleton("totalDownloads");
    showStatSkeleton("totalEarnings");
    showSkeleton(
        document.getElementById("recentlyAddedList"),
        SKELETON_TYPES.FILE,
        { count: 3 }
    );
    showSkeleton(
        document.getElementById("recentActivityList"),
        SKELETON_TYPES.NOTIFICATION,
        { count: 3 }
    );
    showChartSkeleton();
}

function showStatSkeleton(elementId) {
    const element =
    document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.innerHTML =
    `<span class="skeleton-line medium stat-skeleton-line"></span>`;
}

function showChartSkeleton() {
    const chartPreview =
    document.querySelector(".chart-preview");

    if (!chartPreview || document.getElementById("analyticsSkeleton")) {
        return;
    }

    chartPreview.classList.add("chart-loading");

    const skeleton =
    document.createElement("div");

    skeleton.id = "analyticsSkeleton";
    skeleton.className = "chart-skeleton";
    skeleton.innerHTML = `
        <div class="skeleton-line large"></div>
        <div class="skeleton-line medium"></div>
        <div class="skeleton-line large"></div>
        <div class="skeleton-line short"></div>
    `;

    chartPreview.appendChild(skeleton);
}

function clearChartSkeleton() {
    const chartPreview =
    document.querySelector(".chart-preview");

    const skeleton =
    document.getElementById("analyticsSkeleton");

    if (skeleton) {
        skeleton.remove();
    }

    if (chartPreview) {
        chartPreview.classList.remove("chart-loading");
    }
}

function renderDashboard({
    userData,
    stats,
    activities,
    recentlyAdded,
    chart
}) {
    const displayName =
    userData.name || userData.fullName || userData.displayName || "Student";

    setText("greeting", getGreeting(displayName));
    setText("userName", displayName);

    if (stats) {
        setText("totalUploads", stats.uploads);
        setText("totalDownloads", stats.downloads);
        setText("totalEarnings", formatCurrency(stats.earnings));
    }

    if (activities) {
        renderActivities(activities);
    }

    if (recentlyAdded) {
        renderRecentlyAdded(recentlyAdded);
    }

    if (chart) {
        renderChart(chart);
    }

}

function formatRelativeDate(value) {
    const timestamp =
    getTimestampMillis(value);

    if (!timestamp) {
        return "Recently";
    }

    const elapsedMs =
    Date.now() - timestamp;

    const elapsedMinutes =
    Math.max(1, Math.round(elapsedMs / 60000));

    if (elapsedMinutes < 60) {
        return `${elapsedMinutes} minute${elapsedMinutes === 1 ? "" : "s"} ago`;
    }

    const elapsedHours =
    Math.round(elapsedMinutes / 60);

    if (elapsedHours < 24) {
        return `${elapsedHours} hour${elapsedHours === 1 ? "" : "s"} ago`;
    }

    if (elapsedHours < 48) {
        return "Yesterday";
    }

    return formatDate(value, {
        fallback: "Recently",
        options: {
            weekday: "long"
        }
    });
}

function renderRecentlyAdded(resources) {
    const recentlyAddedList =
    document.getElementById("recentlyAddedList");

    if (!recentlyAddedList) {
        return;
    }

    if (!resources.length) {
        recentlyAddedList.innerHTML =
        `<p class="empty-state">No approved resources yet.</p>`;
        return;
    }

    recentlyAddedList.innerHTML =
    resources.map((resource) => `
        <a class="recent-resource-item" href="pages/resource-details.html?id=${encodeURIComponent(resource.id)}">
            <span>${escapeHtml(resource.title || "Untitled Resource")}</span>
            <small>${escapeHtml(formatRelativeDate(resource.createdAt))}</small>
        </a>
    `).join("");
}

function renderActivities(activities) {
    const activityList =
    document.getElementById("recentActivityList");

    if (!activityList) {
        return;
    }

    if (!activities.length) {
        activityList.innerHTML =
        `<p class="empty-state">No recent activity yet.</p>`;
        return;
    }

    activityList.innerHTML =
    activities.map((activity) => {
        const title =
        activity.resourceId ?
        `<a href="pages/resource-details.html?id=${encodeURIComponent(activity.resourceId)}">${escapeHtml(activity.title)}</a>` :
        escapeHtml(activity.title);

        const author =
        activity.ownerId ?
        `<span> by <a href="pages/user-profile.html?id=${encodeURIComponent(activity.ownerId)}">${escapeHtml(activity.ownerName || "Unknown Author")}</a></span>` :
        "";

        return `
        <div class="activity-item">
            <div class="activity-icon">
                ${getActivityIcon(activity.icon)}
            </div>

            <div class="activity-content">
                <h4>${title}${author}</h4>
                <p>${escapeHtml(activity.description)}</p>
            </div>
        </div>
    `;
    }).join("");
}

let analyticsChartInstance = null;

function renderChart(chart) {
    const analyticsChart =
    document.getElementById("analyticsChart");

    if (!analyticsChart) {
        return;
    }

    clearChartSkeleton();

    if (!window.Chart) {
        analyticsChart.dataset.values =
        JSON.stringify(chart);

        warn("ANALYTICS", "Chart.js is not available yet.");
        return;
    }

    if (analyticsChartInstance) {
        analyticsChartInstance.destroy();
    }

    analyticsChartInstance = new window.Chart(analyticsChart, {
        type: "bar",

        data: {
            labels: chart.labels,

            datasets: [
                {
                    label: "Uploads",
                    data: chart.values,
                    backgroundColor: "#3B82F6",
                    borderRadius: 10
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    display: false
                }
            },

            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

setupProfileMenu();
setupLogout();
setupCreateGroupModal();

let unmountNotificationPanel = () => {};

onAuthStateChanged(auth, (user) => {
    unmountNotificationPanel();

    if (!user) {
        return;
    }

    unmountNotificationPanel = mountNotificationPanel({
        recipientId: user.uid,
        trigger: document.getElementById("notificationBtn"),
        panel: document.getElementById("notificationDropdown"),
        list: document.getElementById("notificationList"),
        badge: document.getElementById("notificationCount"),
        markAllButton: document.getElementById("markAllNotificationsRead")
    });

    loadDashboard(user);
});
