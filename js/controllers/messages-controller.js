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
import { PRESENCE_STATUS } from "../config/presence-status.js";
import {
    closeContextMenu
} from "../components/context-menu.js";
import {
    initializeConversationPreferences,
    prepareConversations
} from "./conversation-controller.js?context-menu=1";
import {
    initializeConversationViewTabs
} from "../components/conversation-view-tabs.js";
import {
    renderConversationError,
    renderConversationList
} from "../renderers/conversation-renderer.js?context-menu=1";
import { handleError } from "../utils/error-handler.js?security=1";

const conversationList =
    document.getElementById("conversationList");
const searchInput =
    document.getElementById("conversationSearch");
const conversationViews =
    document.getElementById("conversationViews");

const profileCache = new Map();
let renderedConversations = [];
let currentUserId = null;
let unsubscribeConversations = null;
let conversationPreferenceController = null;
let renderRequestId = 0;
let conversationLoadFailed = false;
let conversationsLoaded = false;
const presenceUnsubscribers = new Map();
let conversationPreferences = new Map();
let currentConversationView = "inbox";

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
    const view = hasSearch ? "search" : currentConversationView;
    const showingArchived = view === "archived";
    const preparedItems = prepareConversations({
        conversations: items,
        preferences: conversationPreferences,
        view
    });

    closeContextMenu();
    renderConversationList({
        items: preparedItems,
        currentUserId: userId,
        container: conversationList,
        preferences: conversationPreferences,
        showPinnedDivider: view !== "archived",
        emptyTitle: hasSearch
            ? "No matches found"
            : showingArchived
                ? "No archived conversations"
                : "No conversations yet",
        emptyMessage: hasSearch
            ? "Try searching for a different student."
            : showingArchived
                ? "Conversations you archive will appear here."
            : "Follow each other with another student to start messaging."
    });
}

function displayConversationError() {
    if (!conversationList) return;

    closeContextMenu();
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

const conversationViewController = initializeConversationViewTabs(
    conversationViews,
    {
        onChange(view) {
            currentConversationView = view;
            filterConversations();
        }
    }
);

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

    conversationPreferenceController?.destroy();

    conversationPreferenceController = initializeConversationPreferences({
        userId: user.uid,
        container: conversationList,
        onPreferencesChange(preferences) {
            conversationPreferences = preferences;
            if (conversationsLoaded) filterConversations();
        },
        onError(error, message) {
            handleError(error, message);
        }
    });

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

    conversationPreferenceController?.destroy();
    conversationViewController.destroy();
    clearPresenceSubscriptions();
});
