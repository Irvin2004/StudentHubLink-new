import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

import { auth } from "../firebase.js";
import {
    getUserProfile as fetchUserProfile,
    subscribeToUserConversations
} from "../services/conversation-service.js";
import {
    subscribeToPresence
} from "../services/presence-service.js";
import {
    createConversationItem
} from "../components/conversation-item.js";
import {
    createEmptyState
} from "../components/empty-state.js";
import { handleError } from "../utils/error-handler.js?security=1";

const conversationList =
    document.getElementById("conversationList");
const searchInput =
    document.getElementById("conversationSearch");

const profileCache = new Map();
let renderedConversations = [];
let currentUserId = null;
let unsubscribeConversations = null;
let renderRequestId = 0;
let conversationLoadFailed = false;
const presenceUnsubscribers = new Map();

async function getUserProfile(userId) {
    if (!userId) {
        return null;
    }

    if (!profileCache.has(userId)) {
        profileCache.set(
            userId,
            fetchUserProfile(userId)
                .catch((error) => {
                    profileCache.delete(userId);
                    throw error;
                })
        );
    }

    return profileCache.get(userId);
}

function displayConversations(items, userId) {
    if (!conversationList) return;

    if (!items.length) {
        const hasSearch = searchInput?.value.trim();

        conversationList.innerHTML = createEmptyState(
            hasSearch ? "No matches found" : "No conversations yet",
            hasSearch
                ? "Try searching for a different student."
                : "Follow each other with another student to start messaging.",
            "&#128172;"
        );
        return;
    }

    conversationList.innerHTML = items
        .map(({ conversation, otherUser }) =>
            createConversationItem(
                conversation,
                userId,
                otherUser
            )
        )
        .join("");
}

function displayConversationError() {
    if (!conversationList) return;

    conversationList.innerHTML = createEmptyState(
        "Conversations unavailable",
        "We couldn't load your conversations. Check your connection and try again.",
        "&#9888;"
    );
}

function clearPresenceSubscriptions() {
    presenceUnsubscribers.forEach((unsubscribe) => {
        unsubscribe();
    });

    presenceUnsubscribers.clear();
}

function syncPresenceSubscriptions(items) {
    const activeUserIds = new Set(
        items
            .map(({ otherUser }) => otherUser?.id)
            .filter(Boolean)
    );

    presenceUnsubscribers.forEach((unsubscribe, userId) => {
        if (activeUserIds.has(userId)) return;

        unsubscribe();
        presenceUnsubscribers.delete(userId);
    });

    activeUserIds.forEach((userId) => {
        if (presenceUnsubscribers.has(userId)) return;

        const unsubscribe = subscribeToPresence(
            userId,
            (presence) => {
                let changed = false;
                const online = presence.online === true;

                renderedConversations.forEach(({ otherUser }) => {
                    if (otherUser?.id !== userId) return;

                    if (otherUser.online !== online) {
                        otherUser.online = online;
                        changed = true;
                    }
                });

                if (changed) {
                    filterConversations();
                }
            }
        );

        presenceUnsubscribers.set(userId, unsubscribe);
    });
}

async function renderConversations(conversations, userId) {
    if (!conversationList) return;

    const requestId = ++renderRequestId;

    if (!conversations.length) {
        renderedConversations = [];
        clearPresenceSubscriptions();
        displayConversations([], userId);
        return;
    }

    const items = await Promise.all(
        conversations.map(async (conversation) => {
            if (conversation.type === "group") {
                return {
                    conversation,
                    otherUser: {
                        displayName: conversation.title || "Study Group",
                        isGroup: true
                    }
                };
            }

            const otherUserId = conversation.participantIds?.find(
                (id) => id !== userId
            );
            const otherUser = await getUserProfile(otherUserId);

            return { conversation, otherUser };
        })
    );

    if (requestId !== renderRequestId) return;

    renderedConversations = items;
    syncPresenceSubscriptions(items);
    filterConversations();
}

function filterConversations() {
    const term = searchInput?.value.trim().toLowerCase() || "";
    const filtered = renderedConversations.filter(({ otherUser }) => {
        const name =
            otherUser?.fullName ||
            otherUser?.name ||
            otherUser?.displayName ||
            "Student";

        return name.toLowerCase().includes(term);
    });

    displayConversations(filtered, currentUserId);
}

searchInput?.addEventListener("input", filterConversations);

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "../login.html";
        return;
    }

    currentUserId = user.uid;
    conversationLoadFailed = false;
    clearPresenceSubscriptions();

    if (typeof unsubscribeConversations === "function") {
        unsubscribeConversations();
    }

    unsubscribeConversations = subscribeToUserConversations(
        user.uid,
        (conversations) => {
            if (conversationLoadFailed) return;

            renderConversations(conversations, user.uid)
                .catch((error) => {
                    handleError(error, "Unable to load conversations.");
                });
        },
        (error) => {
            conversationLoadFailed = true;
            renderedConversations = [];
            clearPresenceSubscriptions();
            displayConversationError();
            handleError(error, "Unable to load conversations.");
        }
    );
});

window.addEventListener("pagehide", (event) => {
    if (event.persisted) {
        return;
    }
    if (typeof unsubscribeConversations === "function") {
        unsubscribeConversations();
    }

    clearPresenceSubscriptions();
});
