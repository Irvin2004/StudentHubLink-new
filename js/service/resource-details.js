import { db } from "../firebase.js";
import { createResourceCard } from "./marketplace.js";
import { RESOURCE_STATUS } from "../utils/constants.js";
import { setText } from "../utils/dom.js";
import { formatPrice } from "../utils/formatPrice.js";

import {
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const params =
new URLSearchParams(window.location.search);

const resourceId =
params.get("id");

async function loadResourceDetails() {
    if (!resourceId) {
        document.body.innerHTML = "<p>Resource not found.</p>";
        return;
    }

    const resourceSnap =
    await getDoc(doc(db, "resources", resourceId));

    if (!resourceSnap.exists()) {
        document.body.innerHTML = "<p>Resource does not exist.</p>";
        return;
    }

    const resource = {
        id: resourceSnap.id,
        ...resourceSnap.data()
    };

    renderResourceDetails(resource);
    await loadRelatedResources(resource);
}

function renderResourceDetails(resource) {
    setText("resourceCategory", resource.category || "General");
    setText("resourceTitle", resource.title || "Untitled Resource");
    setText("resourceDescription", resource.description || "No description available.");
    setText("resourcePrice", formatPrice(resource.price || 0));
    setText("resourceDownloads", resource.downloadCount || 0);
    setText("resourceStatus", resource.status || RESOURCE_STATUS.APPROVED);
    setText("resourceActionBtn", Number(resource.price || 0) > 0 ? "Buy Resource" : "Download");

    const ownerLink =
    document.getElementById("resourceOwner");

    if (!ownerLink) {
        return;
    }

    ownerLink.textContent =
    resource.ownerName || "Unknown Author";

    if (resource.ownerId) {
        ownerLink.href =
        `user-profile.html?id=${encodeURIComponent(resource.ownerId)}`;
    } else {
        ownerLink.removeAttribute("href");
    }
}

async function loadRelatedResources(resource) {
    const relatedResources =
    document.getElementById("relatedResources");

    if (!relatedResources || !resource.category) {
        return;
    }

    relatedResources.innerHTML = `
        <div class="loading-state">
            Loading related resources...
        </div>
    `;

    try {
        const relatedQuery =
        query(
            collection(db, "resources"),
            where("category", "==", resource.category),
            where("status", "==", RESOURCE_STATUS.APPROVED),
            limit(6)
        );

        const snapshot =
        await getDocs(relatedQuery);

        const resources =
        snapshot.docs
            .map((resourceDoc) => ({
                id: resourceDoc.id,
                ...resourceDoc.data()
            }))
            .filter((relatedResource) => relatedResource.id !== resource.id)
            .slice(0, 4);

        if (!resources.length) {
            relatedResources.innerHTML = `
                <div class="empty-state">
                    <h3>No related resources yet</h3>
                    <p>Check back when more ${resource.category} resources are approved.</p>
                </div>
            `;
            return;
        }

        relatedResources.innerHTML =
        resources.map(createResourceCard).join("");
    } catch (error) {
        console.error("Related resources failed:", error);

        relatedResources.innerHTML = `
            <div class="empty-state">
                <h3>Could not load related resources</h3>
                <p>Please try again later.</p>
            </div>
        `;
    }
}

loadResourceDetails();
