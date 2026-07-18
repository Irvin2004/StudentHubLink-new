import { auth, db } from "../firebase.js";
import { createEmptyState } from "../components/empty-state.js";
import { createResourceCard } from "../components/resource-card.js";
import { filterResources } from "../services/filter-service.js";
import { initializeFavoriteButtons } from "../controllers/favorites-controller.js";
import { handleResourceAction } from "../services/marketplace-actions-service.js";
import { searchResources } from "../services/search-service.js";
import { sortResources } from "../services/sort-service.js";
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
    price: "all",
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
        resourceGrid.innerHTML =
        createEmptyState(
            "No resources found",
            "Try changing your search or filters.",
            "&#128269;"
        );

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
    let results =
    searchResources(
        marketplaceState.allResources,
        marketplaceState.search
    );

    results =
    filterResources(results, {
        category: marketplaceState.category,
        price: marketplaceState.price
    });

    results =
    sortResources(
        results,
        marketplaceState.sort
    );

    if (!results.length) {
        resourceGrid.innerHTML =
        createEmptyState(
            "No resources found",
            "Try changing your search term or filters.",
            "&#128269;"
        );
        return;
    }

    renderMarketplace(results);
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

        resourceGrid.innerHTML =
        createEmptyState(
            "Could not load resources",
            "Please try again.",
            "&#9888;"
        );
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

    const priceSelect =
    document.getElementById("priceFilter");

    const categoryButtons =
    document.querySelectorAll(".filter-btn");

    if (searchInput) {
        searchInput.addEventListener("input", (event) => {
            marketplaceState.search =
            event.target.value;

            updateMarketplace();
        });
    }

    if (priceSelect) {
        priceSelect.addEventListener("change", (event) => {
            marketplaceState.price =
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

    categoryButtons.forEach((button) => {
        button.addEventListener("click", () => {
            categoryButtons.forEach((item) =>
                item.classList.remove("active")
            );

            button.classList.add("active");

            marketplaceState.category =
            button.dataset.category || "All";

            updateMarketplace();
        });
    });
}

if (resourceGrid) {
    bindMarketplaceControls();
    initializeFavoriteButtons();
    loadMarketplace();
}
