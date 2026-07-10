import { db } from "../firebase.js";
import { createResourceCard } from "../components/resource-card.js";
import { RESOURCE_STATUS } from "../utils/constants.js";
import { setText } from "../utils/dom.js";
import { formatPrice } from "../utils/formatPrice.js";

import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const params =
new URLSearchParams(window.location.search);

const userId =
params.get("id");

async function loadUserProfile() {
    if (!userId) {
        document.body.innerHTML = "<p>User profile not found.</p>";
        return;
    }

    const userSnap =
    await getDoc(doc(db, "users", userId));

    if (!userSnap.exists()) {
        document.body.innerHTML = "<p>User does not exist.</p>";
        return;
    }

    const userData =
    userSnap.data();

    renderProfile(userData);
    await loadUserResources(userId);
}

function renderProfile(userData) {
    const name =
    userData.fullName || userData.name || "Student";

    setText("profileName", name);
    setText("profileBio", userData.bio || "No bio yet.");
    setText("profileMeta", userData.course || "StudentHub Member");
    setText("profileAvatar", name.charAt(0).toUpperCase());
    setText("profileDownloadCount", userData.totalDownloads || 0);
    setText("profileEarnings", formatPrice(userData.totalEarnings || 0));
}

async function loadUserResources(profileUserId) {
    const userResourcesQuery =
    query(
        collection(db, "resources"),
        where("ownerId", "==", profileUserId),
        where("status", "==", RESOURCE_STATUS.APPROVED)
    );

    const snapshot =
    await getDocs(userResourcesQuery);

    const resources =
    snapshot.docs.map((resourceDoc) => ({
        id: resourceDoc.id,
        ...resourceDoc.data()
    }));

    setText("profileResourceCount", resources.length);
    renderResources(resources);
}

function renderResources(resources) {
    const container =
    document.getElementById("profileResources");

    if (!container) {
        return;
    }

    if (!resources.length) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No approved resources yet</h3>
                <p>This author has not published resources yet.</p>
            </div>
        `;
        return;
    }

    container.innerHTML =
    resources
        .map((resource) =>
            createResourceCard(resource, {
                actions: "details",
                showDate: true,
                showMeta: false,
                showOwner: false
            })
        )
        .join("");
}

loadUserProfile();
