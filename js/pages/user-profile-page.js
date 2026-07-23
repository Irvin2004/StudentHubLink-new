import { auth } from "../../src/firebase/auth.js";
import { db } from "../../src/firebase/firestore.js";
import { createResourceCard } from "../components/resource-card.js";
import {
    areMutuals,
    followUser,
    isFollowing,
    unfollowUser
} from "../services/follows-service.js";
import { createOrGetConversation } from "../services/conversation-service.js";
import { RESOURCE_STATUS } from "../utils/constants.js";
import { setText } from "../utils/dom.js";
import { handleError } from "../services/user-feedback-service.js";
import { formatPrice } from "../utils/format-price.js";
import { showToast } from "../services/user-feedback-service.js";

import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where
} from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";

const params = new URLSearchParams(window.location.search);

const userId = params.get("id");

async function loadUserProfile() {
    if (!userId) {
        document.body.innerHTML = "<p>User profile not found.</p>";
        return;
    }

    const userSnap = await getDoc(doc(db, "users", userId));

    if (!userSnap.exists()) {
        document.body.innerHTML = "<p>User does not exist.</p>";
        return;
    }

    const userData = userSnap.data();

    renderProfile(userData);
    setupFollowControls(userId);
    await loadUserResources(userId);
}

function renderProfile(userData) {
    const name = userData.fullName || userData.name || "Student";

    setText("profileName", name);
    setText("profileBio", userData.bio || "No bio yet.");
    setText("profileMeta", userData.course || "StudentHub Member");
    setText("profileAvatar", name.charAt(0).toUpperCase());
    setText("profileDownloadCount", userData.totalDownloads || 0);
    setText("profileEarnings", formatPrice(userData.totalEarnings || 0));
}

async function loadUserResources(profileUserId) {
    const userResourcesQuery = query(
        collection(db, "resources"),
        where("ownerId", "==", profileUserId),
        where("status", "==", RESOURCE_STATUS.APPROVED)
    );

    const snapshot = await getDocs(userResourcesQuery);

    const resources = snapshot.docs.map((resourceDoc) => ({
        id: resourceDoc.id,
        ...resourceDoc.data()
    }));

    setText("profileResourceCount", resources.length);
    renderResources(resources);
}

function renderResources(resources) {
    const container = document.getElementById("profileResources");

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

    container.innerHTML = resources
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

async function setupFollowControls(profileUserId) {
    const followButton = document.getElementById("followButton");

    const messageButton = document.getElementById("messageButton");

    if (!followButton || !messageButton) {
        return;
    }

    onAuthStateChanged(auth, async (currentUser) => {
        if (!currentUser) {
            followButton.textContent = "Log in to follow";
            followButton.disabled = false;
            followButton.hidden = false;
            messageButton.hidden = true;

            followButton.onclick = () => {
                showToast("Please log in first.", "warning");
            };

            return;
        }

        if (currentUser.uid === profileUserId) {
            followButton.hidden = true;
            messageButton.hidden = true;
            return;
        }

        async function refreshControls() {
            const following = await isFollowing(currentUser.uid, profileUserId);

            const mutual = await areMutuals(currentUser.uid, profileUserId);

            followButton.textContent = following ? "Following" : "Follow";

            followButton.classList.toggle("active", following);

            messageButton.hidden = !mutual;
        }

        followButton.onclick = async () => {
            try {
                followButton.disabled = true;

                const following = await isFollowing(
                    currentUser.uid,
                    profileUserId
                );

                if (following) {
                    await unfollowUser(currentUser.uid, profileUserId);

                    showToast("User unfollowed.", "success");
                } else {
                    await followUser(currentUser.uid, profileUserId);

                    showToast("User followed.", "success");
                }

                await refreshControls();
            } catch (error) {
                handleError(error, "Unable to update follow status.");
            } finally {
                followButton.disabled = false;
            }
        };

        messageButton.onclick = async () => {
            try {
                messageButton.disabled = true;
                messageButton.textContent = "Opening...";

                const conversation = await createOrGetConversation(
                    currentUser.uid,
                    profileUserId
                );

                window.location.href = `chat.html?id=${conversation.id}`;
            } catch (error) {
                handleError(error, "Unable to open conversation.");

                messageButton.disabled = false;
                messageButton.textContent = "Message";
            }
        };

        await refreshControls();
    });
}

loadUserProfile();
