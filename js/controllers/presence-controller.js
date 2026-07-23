"use strict";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

import { auth } from "../firebase.js";
import { PRESENCE_STATUS } from "../config/presence-status.js";
import {
    setUserOffline,
    setUserOnline,
    setUserTyping,
    stopTyping,
    subscribeToPresence
} from "../services/presence-service.js";
import {
    clearPresence,
    renderPresence
import { logError } from "../services/error-service.js";
} from "../renderers/presence-renderer.js";

const TYPING_INACTIVITY_DELAY = 1900;

let applicationController = null;

function cleanId(value) {
    return typeof value === "string" ? value.trim() : "";
}

function reportPresenceError(action, error) {
    logError(error, `Unable to ${action}`);
}

function runPresenceUpdate(action, update) {
    return update().catch((error) => {
        reportPresenceError(action, error);
        throw error;
    });
}

function initializeApplicationPresence() {
    if (applicationController) {
        return applicationController;
    }

    let activeUserId = "";
    let destroyed = false;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        const previousUserId = activeUserId;
        const nextUserId = cleanId(user?.uid);
        activeUserId = nextUserId;

        if (previousUserId && previousUserId !== nextUserId) {
            setUserOffline(previousUserId).catch((error) => {
                reportPresenceError("mark user offline", error);
            });
        }

        if (nextUserId) {
            setUserOnline(nextUserId).catch((error) => {
                reportPresenceError("mark user online", error);
            });
        }
    });

    const handleBeforeUnload = () => {
        if (!activeUserId) return;

        setUserOffline(activeUserId).catch((error) => {
            reportPresenceError("mark user offline", error);
        });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    applicationController = {
        destroy() {
            if (destroyed) return;
            destroyed = true;

            unsubscribeAuth();
            window.removeEventListener(
                "beforeunload",
                handleBeforeUnload
            );
            applicationController = null;
        }
    };

    return applicationController;
}

function initializeConversationPresence({
    currentUserId,
    otherUserId = "",
    conversationId = "",
    messageInput = null,
    container = null
}) {
    const cleanCurrentUserId = cleanId(currentUserId);
    const cleanOtherUserId = cleanId(otherUserId);
    const cleanConversationId = cleanId(conversationId);
    const observedUserId = cleanOtherUserId || cleanCurrentUserId;

    if (!cleanCurrentUserId) {
        throw new Error("Current user ID is required.");
    }

    if (!container) {
        throw new Error("Presence container is required.");
    }

    let destroyed = false;
    let isTyping = false;
    let typingTimer = null;

    renderPresence(
        {
            userId: observedUserId,
            status: observedUserId === cleanCurrentUserId
                ? PRESENCE_STATUS.ONLINE
                : PRESENCE_STATUS.OFFLINE,
            conversationId: ""
        },
        container,
        cleanConversationId
    );

    runPresenceUpdate(
        "mark user online",
        () => setUserOnline(cleanCurrentUserId)
    ).catch(() => {});

    const unsubscribe = subscribeToPresence(
        observedUserId,
        (presence) => {
            if (destroyed) return;

            renderPresence(
                presence,
                container,
                cleanConversationId
            );
        },
        (error) => {
            reportPresenceError("load presence", error);
        }
    );

    function clearTypingTimer() {
        if (typingTimer) {
            clearTimeout(typingTimer);
            typingTimer = null;
        }
    }

    function markTypingStopped() {
        clearTypingTimer();

        if (!isTyping) {
            return Promise.resolve();
        }

        isTyping = false;
        return runPresenceUpdate(
            "stop typing",
            () => stopTyping(cleanCurrentUserId)
        ).catch(() => {});
    }

    function restartTypingTimer() {
        clearTypingTimer();
        typingTimer = setTimeout(
            markTypingStopped,
            TYPING_INACTIVITY_DELAY
        );
    }

    function handleMessageInput() {
        if (destroyed || !cleanConversationId) return;

        if (!String(messageInput?.value || "").trim()) {
            markTypingStopped();
            return;
        }

        isTyping = true;
        setUserTyping(
            cleanCurrentUserId,
            cleanConversationId
        ).catch((error) => {
            reportPresenceError("set typing status", error);
        });
        restartTypingTimer();
    }

    if (messageInput?.addEventListener) {
        messageInput.addEventListener("input", handleMessageInput);
    }

    const handlePageHide = (event) => {
        if (event.persisted) return;

        clearTypingTimer();
        isTyping = false;
        setUserOffline(cleanCurrentUserId).catch((error) => {
            reportPresenceError("mark user offline", error);
        });
    };

    window.addEventListener("pagehide", handlePageHide);

    return {
        stopTyping: markTypingStopped,

        destroy() {
            if (destroyed) return;
            destroyed = true;

            clearTypingTimer();
            unsubscribe();
            messageInput?.removeEventListener?.(
                "input",
                handleMessageInput
            );
            window.removeEventListener("pagehide", handlePageHide);

            if (isTyping) {
                isTyping = false;
                stopTyping(cleanCurrentUserId).catch((error) => {
                    reportPresenceError("stop typing", error);
                });
            }

            clearPresence(container);
        }
    };
}

export function initializePresence(options) {
    if (options === undefined) {
        return initializeApplicationPresence();
    }

    return initializeConversationPresence(options || {});
}
