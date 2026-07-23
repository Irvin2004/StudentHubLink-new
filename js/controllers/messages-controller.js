import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

import { auth } from "../firebase.js";
import {
    getUserProfile as fetchUserProfile,
    pinConversation,
    subscribeToConversationPreferences,
    unpinConversation,
    subscribeToUserConversations
} from "../services/conversation-service.js";
import {
    subscribeToPresence
} from "../services/presence-service.js";
import { PRESENCE_STATUS } from "../config/presence-status.js";
import {
    closeConversationMenu,
    destroyConversationMenu,
    toggleConversationMenu
} from "../components/conversation-menu.js?preferences=1";
import {
    renderConversationError,
    renderConversationList
} from "../renderers/conversation-renderer.js?preferences=1";
import {
    CONVERSATION_PREFERENCES
} from "../config/conversation-preference-types.js";
import { handleError } from "../utils/error-handler.js?security=1";

const conversationList =
    document.getElementById("conversationList");
const searchInput =
    document.getElementById("conversationSearch");

const profileCache = new Map();
let renderedConversations = [];
let currentUserId = null;
let unsubscribeConversations = null;
let unsubscribePreferences = null;
let renderRequestId = 0;
let conversationLoadFailed = false;
let conversationsLoaded = false;
const presenceUnsubscribers = new Map();
let conversationPreferences = new Map();

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

    const hasSearch = Boolean(searchInput?.value.trim());

    closeConversationMenu();
    renderConversationList({
        items,
        currentUserId: userId,
        container: conversationList,
        preferences: conversationPreferences,
        emptyTitle: hasSearch ? "No matches found" : "No conversations yet",
        emptyMessage: hasSearch
            ? "Try searching for a different student."
            : "Follow each other with another student to start messaging."
    });
}

function displayConversationError() {
    if (!conversationList) return;

    closeConversationMenu();
    renderConversationError(conversationList);
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
                const online = (
                    presence.status === PRESENCE_STATUS.ONLINE ||
                    presence.status === PRESENCE_STATUS.TYPING
                );

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

conversationList?.addEventListener("click", async (event) => {
    if (!(event.target instanceof Element)) return;

    const menuTrigger = event.target.closest(
        "[data-conversation-menu-trigger]"
    );

    if (menuTrigger) {
        event.preventDefault();
        toggleConversationMenu(menuTrigger);
        return;
    }

    const actionButton = event.target.closest(
        "[data-conversation-action]"
    );

    if (
        !actionButton ||
        actionButton.dataset.conversationAction !==
            CONVERSATION_PREFERENCES.PINNED ||
        !currentUserId
    ) {
        return;
    }

    event.preventDefault();
    const conversationId = actionButton.dataset.conversationId;
    const preference = conversationPreferences.get(conversationId);

    actionButton.disabled = true;
    closeConversationMenu();

    try {
        if (preference?.pinned) {
            await unpinConversation(currentUserId, conversationId);
        } else {
            await pinConversation(currentUserId, conversationId);
        }
    } catch (error) {
        handleError(
            error,
            preference?.pinned
                ? "Unable to unpin conversation."
                : "Unable to pin conversation."
        );
    } finally {
        if (actionButton.isConnected) actionButton.disabled = false;
    }
});

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "../login.html";
        return;
    }

    currentUserId = user.uid;
    conversationLoadFailed = false;
    conversationsLoaded = false;
    conversationPreferences = new Map();
    clearPresenceSubscriptions();

    if (typeof unsubscribeConversations === "function") {
        unsubscribeConversations();
    }

    if (typeof unsubscribePreferences === "function") {
        unsubscribePreferences();
    }

    unsubscribePreferences = subscribeToConversationPreferences(
        user.uid,
        (preferences) => {
            conversationPreferences = new Map(
                preferences.map((preference) => [
                    preference.conversationId,
                    preference
                ])
            );
            if (conversationsLoaded) filterConversations();
        },
        (error) => {
            conversationPreferences = new Map();
            if (conversationsLoaded) filterConversations();
            handleError(
                error,
                "Unable to load conversation preferences."
            );
        }
    );

    unsubscribeConversations = subscribeToUserConversations(
        user.uid,
        (conversations) => {
            if (conversationLoadFailed) return;

            conversationsLoaded = true;
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

    if (typeof unsubscribePreferences === "function") {
        unsubscribePreferences();
    }

    clearPresenceSubscriptions();
    destroyConversationMenu();
});
