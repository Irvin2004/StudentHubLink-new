import { auth } from "../firebase/firebase-config.js";
import { createResourceCard } from "../components/resource-card.js";
import {
    createCommentsController
} from "../controllers/comments-controller.js";
import { handleResourceAction } from "../services/marketplace-actions-service.js";
import {
    getMarketplaceResource,
    subscribeToMarketplaceResource
} from "../services/marketplace-resource-service.js";
import {
    getRelatedResources
} from "../services/recommendation-service.js";
import {
    createReviewsController
} from "../controllers/reviews-controller.js";
import { RESOURCE_STATUS } from "../utils/constants.js";
import { setText } from "../utils/dom.js";
import { formatPrice } from "../utils/format-price.js";
import { handleError } from "../services/user-feedback-service.js";
import { error as logError } from "../utils/logger.js";
import { showToast } from "../services/user-feedback-service.js";

const params =
new URLSearchParams(window.location.search);

const resourceId =
params.get("id");

let commentsController = null;

let reviewsController = null;

let unsubscribeResource =
null;

async function loadResourceDetails() {
    if (!resourceId) {
        document.body.innerHTML = "<p>Resource not found.</p>";
        return;
    }

    const resource = await getMarketplaceResource(resourceId);

    if (!resource) {
        document.body.innerHTML = "<p>Resource does not exist.</p>";
        return;
    }

    renderResourceDetails(resource);
    subscribeToResourceUpdates(resource.id);
    reviewsController = createReviewsController({ resource });
    await reviewsController.initialize();
    commentsController = createCommentsController({
        resourceId: resource.id
    });
    commentsController.initialize();

    try {
        const related =
        await getRelatedResources(resource);

        renderRelatedResources(related);
    } catch (error) {
        logError("FIRESTORE", "Related resources failed:", error);
        renderRelatedResources([]);
    }

    bindResourceAction(resource);
}

function subscribeToResourceUpdates(resourceId) {
    if (typeof unsubscribeResource === "function") {
        unsubscribeResource();
    }

    unsubscribeResource =
    subscribeToMarketplaceResource(
        resourceId,
        async (resource) => {
            if (!resource) {
                return;
            }

            renderResourceDetails(resource);
            await reviewsController?.refresh(resource);
        },
        (error) => {
            logError("FIRESTORE", "Resource updates failed:", error);
        }
    );
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

function bindResourceAction(resource) {
    const actionButton =
    document.getElementById("resourceActionBtn");

    if (!actionButton) {
        return;
    }

    actionButton.addEventListener("click", async () => {
        const user =
        auth.currentUser;

        if (!user) {
            showToast("Please login first.", "warning");
            return;
        }

        actionButton.disabled = true;

        try {
            await handleResourceAction(resource, user);
            actionButton.textContent =
            Number(resource.price || 0) > 0 ? "Purchase Started" : "Downloaded";
            showToast(
                Number(resource.price || 0) > 0 ?
                "Demo purchase complete." :
                "Resource added to your library.",
                "success"
            );
        } catch (error) {
            handleError(error, "Unable to download this resource.");
            actionButton.disabled = false;
        }
    });
}

function renderRelatedResources(resources) {
    const container =
    document.getElementById("relatedResources");

    if (!container) {
        return;
    }

    if (!resources.length) {
        container.innerHTML =
        "<p>No related resources found.</p>";
        return;
    }

    container.innerHTML =
    resources
        .map((resource) =>
            createResourceCard(resource, {
                actions: "details",
                showDate: false,
                showMeta: false,
                showOwner: true
            })
        )
        .join("");
}

window.addEventListener("pagehide", (event) => {
    if (event.persisted) {
        return;
    }
    commentsController?.destroy();
    reviewsController?.destroy();

    if (typeof unsubscribeResource === "function") {
        unsubscribeResource();
    }
});

loadResourceDetails();
