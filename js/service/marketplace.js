import { auth, db } from "../firebase.js";
import { handleResourceAction } from "./marketplace-actions.js";
import {
    RESOURCE_ACTION,
    RESOURCE_STATUS,
    getResourceAction
} from "../utils/constants.js";
import { escapeHtml, setText } from "../utils/dom.js";
import { formatDate } from "../utils/formatDate.js";
import { formatPrice } from "../utils/formatPrice.js";

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
        console.warn("Ordered marketplace query failed, retrying without orderBy:", error);
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

export function createResourceCard(resource) {
    const ownerName =
    resource.ownerName || "Unknown Author";

    const ownerId =
    encodeURIComponent(resource.ownerId || "");

    const resourceId =
    encodeURIComponent(resource.id || "");

    const priceLabel =
    formatPrice(resource.price);

    const primaryAction =
    getResourceAction(resource) === RESOURCE_ACTION.PURCHASE ? "Preview" : "Download";

    return `
    <article class="resource-card">
        <div class="resource-body">
            <div class="resource-card-top">
                <span class="resource-icon" aria-hidden="true">&#128196;</span>
                <span class="price-badge">
                    ${escapeHtml(priceLabel)}
                </span>
            </div>

            <h3>${escapeHtml(resource.title)}</h3>

            <p class="resource-category">
                ${escapeHtml(resource.category)}
            </p>

            <p class="resource-owner">
                Uploaded by
                <a href="user-profile.html?id=${ownerId}">
                    ${escapeHtml(ownerName)}
                </a>
            </p>

            <p class="resource-date">
                Uploaded: ${escapeHtml(formatDate(resource.createdAt))}
            </p>

            <div class="resource-meta">
                <span class="resource-rating">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                <span>Coming Soon</span>
            </div>

            <div class="resource-actions">
                <a class="secondary-btn" href="resource-details.html?id=${resourceId}">
                    View Details
                </a>
                <button class="btn-secondary" type="button" data-preview-id="${escapeHtml(resource.id)}">Preview</button>
                <button class="btn-primary" type="button" data-preview-id="${escapeHtml(resource.id)}">
                    ${escapeHtml(primaryAction)}
                </button>
            </div>
        </div>
    </article>
    `;
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
        .map(createResourceCard)
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

    resourceGrid.innerHTML = `
    <div class="loading-state">
        Loading resources...
    </div>
    `;

    try {
        marketplaceState.allResources =
        await getApprovedResources();

        updateMarketplace();
    } catch (error) {
        console.error("Marketplace load failed:", error);

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
        alert("Please login first.");
        return;
    }

    await handleResourceAction(selectedResource, user);

    alert(
        getResourceAction(selectedResource) === RESOURCE_ACTION.PURCHASE ?
        "Demo purchase complete." :
        "Demo download recorded."
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
