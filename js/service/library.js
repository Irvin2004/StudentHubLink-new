import {
    collection,
    doc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
    where
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

import { app, db } from "../firebase.js";
import {
    getResourceActionLabel,
    RESOURCE_ACTION
} from "../utils/constants.js";
import { getTimestampMillis } from "../utils/formatDate.js";

const LIBRARY_COLLECTION = "libraries";

const auth =
getAuth(app);

const libraryState = {
    resources: [],
    search: "",
    category: "All",
    sort: "recent"
};

const escapeHtml = (value) =>
String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export async function addToLibrary(resource, user, action) {
    if (!resource || !user) {
        return null;
    }

    const resourceId =
    resource.id || resource.resourceId || resource.title;

    if (!resourceId) {
        console.warn("Library item skipped: missing resource id.");
        return null;
    }

    const libraryItemId =
    `${user.uid}_${resourceId}`;

    const libraryItemRef =
    doc(db, LIBRARY_COLLECTION, libraryItemId);

    await setDoc(libraryItemRef, {
        userId: user.uid,
        resourceId,
        resourceTitle: resource.title || "Untitled Resource",
        title: resource.title || "Untitled Resource",
        description: resource.description || "",
        category: resource.category || "Uncategorized",
        ownerName: resource.ownerName || "Unknown Author",
        price: Number(resource.price) || 0,
        action,
        type: action,
        fileUrl: resource.fileUrl || "",
        downloadUrl: resource.downloadUrl || "",
        createdAt: resource.createdAt || null,
        addedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    }, {
        merge: true
    });

    return libraryItemId;
}

async function getUserLibrary(userId) {
    if (!userId) {
        return [];
    }

    const libraryQuery =
    query(
        collection(db, LIBRARY_COLLECTION),
        where("userId", "==", userId)
    );

    const snapshot =
    await getDocs(libraryQuery);

    return snapshot.docs
        .map((libraryDoc) => ({
            id: libraryDoc.id,
            ...libraryDoc.data()
        }))
        .sort((firstResource, secondResource) =>
            getTimestampMillis(secondResource.addedAt) -
            getTimestampMillis(firstResource.addedAt)
        );
}

function createLibraryCard(resource) {
    const action =
    resource.type || resource.action || RESOURCE_ACTION.DOWNLOAD;

    return `
        <article class="resource-card">
            <div class="resource-body">
                <span class="resource-category">
                    ${escapeHtml(resource.category || "Uncategorized")}
                </span>

                <h3>
                    ${escapeHtml(resource.title || resource.resourceTitle || "Untitled Resource")}
                </h3>

                <p class="library-date">
                    ${escapeHtml(getResourceActionLabel(action))}
                </p>

                <div class="resource-actions">
                    <button class="btn-secondary" type="button">
                        Open
                    </button>

                    <button class="btn-primary" type="button">
                        Download Again
                    </button>
                </div>
            </div>
        </article>
    `;
}

function renderLibrary(resources) {
    const libraryGrid =
    document.getElementById("libraryGrid");

    if (!libraryGrid) return;

    const count =
    document.getElementById("libraryCount");

    if (count) {
        count.textContent =
        resources.length;
    }

    if (!resources.length) {
        libraryGrid.innerHTML = `
            <div class="empty-state">
                <h2>
                    Your library is empty
                </h2>

                <p>
                    Download or purchase a resource to
                    see it here.
                </p>
            </div>
        `;

        return;
    }

    libraryGrid.innerHTML =
    resources
        .map(createLibraryCard)
        .join("");
}

function updateLibrary() {
    let resources =
    [...libraryState.resources];

    if (libraryState.search) {
        const search =
        libraryState.search.toLowerCase().trim();

        resources = resources.filter((resource) => (
            (resource.title || resource.resourceTitle || "")
                .toLowerCase()
                .includes(search) ||
            (resource.description || "")
                .toLowerCase()
                .includes(search) ||
            (resource.category || "")
                .toLowerCase()
                .includes(search) ||
            (resource.ownerName || "")
                .toLowerCase()
                .includes(search)
        ));
    }

    if (libraryState.category !== "All") {
        resources = resources.filter((resource) =>
            resource.category === libraryState.category
        );
    }

    switch (libraryState.sort) {
        case "oldest":
            resources.sort((firstResource, secondResource) =>
                getTimestampMillis(firstResource.addedAt) -
                getTimestampMillis(secondResource.addedAt)
            );
            break;

        case "title":
            resources.sort((firstResource, secondResource) =>
                String(firstResource.title || firstResource.resourceTitle || "")
                    .localeCompare(
                        String(secondResource.title || secondResource.resourceTitle || "")
                    )
            );
            break;

        case "recent":
        default:
            resources.sort((firstResource, secondResource) =>
                getTimestampMillis(secondResource.addedAt) -
                getTimestampMillis(firstResource.addedAt)
            );
            break;
    }

    renderLibrary(resources);
}

function bindLibraryControls() {
    const searchInput =
    document.getElementById("librarySearch");

    if (searchInput) {
        searchInput.addEventListener("input", (event) => {
            libraryState.search =
            event.target.value;

            updateLibrary();
        });
    }

    const sortSelect =
    document.getElementById("librarySort");

    if (sortSelect) {
        sortSelect.addEventListener("change", (event) => {
            libraryState.sort =
            event.target.value;

            updateLibrary();
        });
    }

    document
        .querySelectorAll(".library-filter")
        .forEach((button) => {
            button.addEventListener("click", () => {
                document
                    .querySelectorAll(".library-filter")
                    .forEach((filterButton) =>
                        filterButton.classList.remove("active")
                    );

                button.classList.add("active");

                libraryState.category =
                button.dataset.category || "All";

                updateLibrary();
            });
        });
}

function loadLibraryPage() {
    const libraryGrid =
    document.getElementById("libraryGrid");

    if (!libraryGrid) {
        return;
    }

    bindLibraryControls();

    libraryGrid.innerHTML = `
        <div class="loading-state">
            Loading your library...
        </div>
    `;

    onAuthStateChanged(auth, async (user) => {
        if (!user) return;

        try {
            libraryState.resources =
            await getUserLibrary(user.uid);

            updateLibrary();
        } catch (error) {
            console.error("Library load failed:", error);

            libraryGrid.innerHTML = `
                <div class="empty-state">
                    <h2>Could not load your library</h2>
                    <p>Please try again.</p>
                </div>
            `;
        }
    });
}

loadLibraryPage();
