import { onAuthStateChanged } from
    "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

import { auth } from "../firebase/firebase-config.js";
import { RESOURCE_CATEGORY_OPTIONS } from "../config/resource-categories.js";
import { renderResources } from "../renderers/resource-renderer.js";
import {
    getStudyGroup,
    getStudyGroupMemberships
} from "../services/group-service.js?security=1";
import {
    createGroupResource,
    getGroupResources
} from "../services/resource-service.js?security=1";
import { uploadGroupResource } from "../services/resource-storage-service.js?security=1";
import { handleError } from "../services/user-feedback-service.js";
import { validateAttachment } from "../utils/file-validator.js?security=1";
import { showToast } from "../services/user-feedback-service.js";
import { sanitizeUrl } from "../utils/validators.js";
import { filterResources } from "../utils/filter-resources.js";
import { searchResources } from "../utils/search.js";
import { sortResources } from "../utils/sort-resources.js";
import { debounce } from "../utils/debounce.js";
import { appendNodes } from "../utils/dom-batch.js";
import {
    createEmptyState
} from "../components/empty-state.js?refinement=1";
import {
    SKELETON_TYPES
} from "../config/skeleton-types.js";
import {
    hideSkeleton,
    showSkeleton
} from "../renderers/skeleton-renderer.js";

const SEARCH_DELAY = 200;

const groupId = new URLSearchParams(window.location.search).get("id");
const form = document.getElementById("resourceUploadForm");
const categorySelect = document.getElementById("resourceCategory");
const categoryFilter = document.getElementById("resourceCategoryFilter");
const searchInput = document.getElementById("resourceSearch");
const sortSelect = document.getElementById("resourceSort");
const uploadPanel = document.getElementById("resourceUploadPanel");
const uploadButton = document.getElementById("resourceUploadButton");
const progress = document.getElementById("resourceUploadProgress");
const uploadBar = document.getElementById("resourceUploadBar");
const resourceList = document.getElementById("resourceList");
const accessMessage = document.getElementById("resourceAccessMessage");

let currentUser = null;
let allResources = [];

function createCategoryOption(category) {
    const option = document.createElement("option");
    option.value = category.value;
    option.textContent = category.label;
    return option;
}

function populateCategories() {
    if (categorySelect && !categorySelect.options.length) {
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "Select a category";
        placeholder.disabled = true;
        placeholder.selected = true;
        appendNodes(categorySelect, [
            placeholder,
            ...RESOURCE_CATEGORY_OPTIONS.map(createCategoryOption)
        ]);
    }

    if (categoryFilter && categoryFilter.options.length === 1) {
        appendNodes(
            categoryFilter,
            RESOURCE_CATEGORY_OPTIONS.map(createCategoryOption)
        );
    }
}

function applyResourceView() {
    const searchResults = searchResources(
        allResources,
        searchInput?.value || ""
    );
    const category = categoryFilter?.value || "all";
    const filteredResources = filterResources(searchResults, {
        category: category === "all" ? "" : category
    });
    const resources = sortResources(
        filteredResources,
        sortSelect?.value || "newest"
    );

    renderResources(resources, resourceList);
}
function setProgress(value) {
    const safeValue = Math.max(0, Math.min(100, value));
    uploadBar.style.width = `${safeValue}%`;
    progress.setAttribute("aria-valuenow", String(safeValue));
}

async function loadResources() {
    allResources = await getGroupResources(groupId);
    applyResourceView();
}

function getResourceById(resourceId) {
    return allResources.find((resource) => resource.id === resourceId);
}

function openResource(resource, download = false) {
    const url = sanitizeUrl(resource?.fileURL);

    if (!resource || url === "#") {
        showToast("This resource file is unavailable.", "error");
        return;
    }

    if (!download) {
        window.open(url, "_blank", "noopener,noreferrer");
        return;
    }

    const link = document.createElement("a");
    link.href = url;
    link.download = resource.fileName || resource.title || "resource";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
}

resourceList?.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;

    const action = event.target.closest(
        ".preview-resource, .download-resource"
    );

    if (!action) return;

    const resource = getResourceById(action.dataset.id);
    openResource(
        resource,
        action.classList.contains("download-resource")
    );
});

const scheduleResourceView = debounce(applyResourceView, SEARCH_DELAY);

searchInput?.addEventListener("input", scheduleResourceView);
categoryFilter?.addEventListener("change", applyResourceView);
sortSelect?.addEventListener("change", applyResourceView);

form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const file = document.getElementById("resourceFile").files?.[0];

    try {
        validateAttachment(file);
        uploadButton.disabled = true;
        uploadButton.textContent = "Uploading...";
        progress.classList.remove("hidden");
        setProgress(0);

        const uploaded = await uploadGroupResource(
            file,
            groupId,
            currentUser.uid,
            setProgress
        );

        await createGroupResource({
            groupId,
            title: document.getElementById("resourceTitle").value,
            description:
                document.getElementById("resourceDescription").value,
            category: categorySelect.value,
            fileURL: uploaded.url,
            storagePath: uploaded.storagePath,
            fileName: uploaded.fileName,
            fileSize: uploaded.fileSize,
            mimeType: uploaded.mimeType,
            uploader: currentUser
        });

        form.reset();
        showToast("Resource uploaded.", "success");
        await loadResources();
    } catch (error) {
        handleError(error, "Unable to upload resource.");
    } finally {
        uploadButton.disabled = false;
        uploadButton.textContent = "Upload Resource";
        setProgress(0);
        progress.classList.add("hidden");
    }
});

async function initializePage(user) {
    if (!groupId) {
        window.location.href = "groups.html";
        return;
    }

    try {
        if (resourceList) {
            showSkeleton(resourceList, SKELETON_TYPES.FILE, {
                count: 4,
            });
        }

        const [group, memberships] = await Promise.all([
            getStudyGroup(groupId),
            getStudyGroupMemberships([groupId], user.uid)
        ]);
        const isMember = memberships.has(groupId);

        document.getElementById("groupResourcesTitle").textContent =
            `${group.name} Resources`;
        document.getElementById("groupBackLink").href =
            `group-details.html?id=${encodeURIComponent(groupId)}`;

        if (!isMember) {
            accessMessage.textContent =
                "Join this study group to view and upload its resources.";
            hideSkeleton(resourceList);
            resourceList.innerHTML = createEmptyState({
                icon: "&#128274;",
                title: "Members-only resources",
                message: "Join this study group to access shared files."
            });
            return;
        }

        accessMessage.classList.add("hidden");
        uploadPanel.classList.remove("hidden");
        await loadResources();
    } catch (error) {
        handleError(error, "Unable to load group resources.");
        accessMessage.textContent =
            "Group resources are unavailable right now.";
        if (
            resourceList?.querySelector("[data-skeleton-root]")
        ) {
            hideSkeleton(resourceList);
        }
        if (resourceList) {
            resourceList.innerHTML = createEmptyState({
                icon: "&#9888;",
                title: "Resources unavailable",
                message: "Check your connection and try again."
            });
        }
    }
}

populateCategories();

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "../login.html";
        return;
    }

    currentUser = user;
    initializePage(user);
});

window.addEventListener("pagehide", (event) => {
    if (!event.persisted) scheduleResourceView.cancel();
});
