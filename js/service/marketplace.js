import { auth, db } from "../firebase.js";
import { createResourceCard } from "../components/resource-card.js";
import { handleResourceAction } from "./marketplace-actions.js";
import {
    RESOURCE_ACTION,
    RESOURCE_STATUS,
    getResourceAction
} from "../utils/constants.js";
import { setText } from "../utils/dom.js";
import { formatPrice } from "../utils/formatPrice.js";
import { clearSkeleton, showSkeleton } from "../utils/loading.js";
import { warn, error as logError } from "../utils/logger.js";
import { showToast } from "../utils/toast.js";

import {
    collection,
    getDocs,
    orderBy,
    query,
    where
}
from
"https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const resourceGrid =
document.getElementById("resourceGrid");

const marketplaceState = {
    allResources: [],
    search: "",
    category: "All",
    sort: "newest"
};

async function getApprovedResources() {
    const approvedResourcesQuery =
    query(
        collection(db, "resources"),
        where("status", "==", RESOURCE_STATUS.APPROVED),
        orderBy("createdAt", "desc")
    );

    try {
        const snapshot =
        await getDocs(approvedResourcesQuery);

        return snapshot.docs.map((resourceDoc) => ({
            id: resourceDoc.id,
            ...resourceDoc.data()
        }));
    } catch (error) {
        warn("FIRESTORE", "Ordered marketplace query failed, retrying without orderBy:", error);
    }

    const fallbackQuery =
    query(
        collection(db, "resources"),
        where("status", "==", RESOURCE_STATUS.APPROVED)
    );

    const snapshot =
    await getDocs(fallbackQuery);

    return snapshot.docs.map((resourceDoc) => ({
        id: resourceDoc.id,
        ...resourceDoc.data()
    }))
        .sort((firstResource, secondResource) => {
            const firstCreatedAt =
            firstResource.createdAt?.toMillis?.() || 0;

            const secondCreatedAt =
            secondResource.createdAt?.toMillis?.() || 0;

            return secondCreatedAt - firstCreatedAt;
        });
}

function renderMarketplace(resources) {
    if (!resourceGrid) {
        return;
    }

    if (resources.length === 0) {
        resourceGrid.innerHTML = `
        <div class="empty-state">
            <h3>No resources available</h3>
            <p>Check back later or upload the first resource!</p>
        </div>
        `;

        return;
    }

    resourceGrid.innerHTML =
    resources
        .map((resource) =>
            createResourceCard(resource, {
                actions: "marketplace",
                showDate: true,
                showDownloadCount: true,
                showMeta: true,
                showOwner: true
            })
        )
        .join("");
}

function updateMarketplace() {
    let resources =
    [...marketplaceState.allResources];

    if (marketplaceState.search) {
        const search =
        marketplaceState.search.toLowerCase().trim();

        resources =
        resources.filter((resource) => {
            const title =
            (resource.title || "").toLowerCase();

            const description =
            (resource.description || "").toLowerCase();

            const category =
            (resource.category || "").toLowerCase();

            const owner =
            (resource.ownerName || "").toLowerCase();

            return (
                title.includes(search) ||
                description.includes(search) ||
                category.includes(search) ||
                owner.includes(search)
            );
        });
    }

    if (marketplaceState.category !== "All") {
        resources =
        resources.filter((resource) =>
            resource.category === marketplaceState.category
        );
    }

    switch (marketplaceState.sort) {
        case "newest":
            resources.sort((a, b) => {
                const first =
                a.createdAt?.toDate?.() ?? new Date(0);

                const second =
                b.createdAt?.toDate?.() ?? new Date(0);

                return second - first;
            });
            break;

        case "oldest":
            resources.sort((a, b) => {
                const first =
                a.createdAt?.toDate?.() ?? new Date(0);

                const second =
                b.createdAt?.toDate?.() ?? new Date(0);

                return first - second;
            });
            break;

        case "free":
            resources.sort((a, b) =>
                (a.price || 0) - (b.price || 0)
            );
            break;

        case "paid":
            resources.sort((a, b) =>
                (b.price || 0) - (a.price || 0)
            );
            break;

        case "downloads":
            resources.sort((a, b) =>
                (b.downloadCount || 0) -
                (a.downloadCount || 0)
            );
            break;

        default:
            break;
    }

    renderMarketplace(resources);
}

async function loadMarketplace() {
    if (!resourceGrid) {
        return;
    }

    showSkeleton("resourceGrid");

    try {
        marketplaceState.allResources =
        await getApprovedResources();

        clearSkeleton("resourceGrid");
        updateMarketplace();
    } catch (error) {
        logError("FIRESTORE", "Marketplace load failed:", error);

        resourceGrid.innerHTML = `
        <div class="empty-state">
            <h3>Could not load resources</h3>
            <p>Please try again.</p>
        </div>
        `;
    }
}

let selectedResource = null;

function openResourceModal(resourceId) {
    selectedResource =
        marketplaceState.allResources.find(resource => resource.id === resourceId);

    if (!selectedResource) return;

    setText("modalCategory", selectedResource.category || "General");

    setText("modalTitle", selectedResource.title || "Untitled resource");

    setText("modalDescription", selectedResource.description || "No description available.");

    setText("modalOwner", selectedResource.ownerName || "Unknown Author");

    setText("modalPrice", formatPrice(selectedResource.price));

    setText("modalDownloads", selectedResource.downloadCount || 0);

    setText(
        "modalAction",
        getResourceAction(selectedResource) === RESOURCE_ACTION.PURCHASE ?
        "Buy Resource" :
        "Download"
    );

    document.getElementById("resourceModal").classList.add("show");
}

function closeResourceModal() {
    document.getElementById("resourceModal").classList.remove("show");
    selectedResource = null;
}

document.addEventListener("click", (event) => {
    const previewBtn = event.target.closest("[data-preview-id]");

    if (previewBtn) {
        openResourceModal(previewBtn.dataset.previewId);
    }
});

document.getElementById("closeResourceModal")?.addEventListener("click", closeResourceModal);
document.getElementById("modalCancel")?.addEventListener("click", closeResourceModal);

document.getElementById("modalAction")?.addEventListener("click", async () => {
    if (!selectedResource) return;

    const user =
    auth.currentUser;

    if (!user) {
        showToast("Please login first.", "warning");
        return;
    }

    await handleResourceAction(selectedResource, user);

    showToast(
        getResourceAction(selectedResource) === RESOURCE_ACTION.PURCHASE ?
        "Demo purchase complete." :
        "Demo download recorded.",
        "success"
    );

    closeResourceModal();
});

function bindMarketplaceControls() {
    const searchInput =
    document.getElementById("resourceSearch");

    const sortSelect =
    document.getElementById("sortResources");

    if (searchInput) {
        searchInput.addEventListener("input", (event) => {
            marketplaceState.search =
            event.target.value;

            updateMarketplace();
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener("change", (event) => {
            marketplaceState.sort =
            event.target.value;

            updateMarketplace();
        });
    }

    document
        .querySelectorAll(".filter-btn")
        .forEach((button) => {
            button.addEventListener("click", () => {
                document
                    .querySelectorAll(".filter-btn")
                    .forEach((filterButton) => {
                        filterButton.classList.remove("active");
                    });

                button.classList.add("active");

                marketplaceState.category =
                button.dataset.category;

                updateMarketplace();
            });
        });
}

if (resourceGrid) {
    bindMarketplaceControls();
    loadMarketplace();
}
