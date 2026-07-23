"use strict";

import { logError } from "../services/error-service.js";

const HIGHLIGHT_DURATION = 2000;

function cleanId(value) {
    return typeof value === "string" ? value.trim() : "";
}

function escapeAttributeValue(value) {
    return value
        .replaceAll("\\", "\\\\")
        .replaceAll('"', '\\"');
}

export function initializeReplyNavigation({
    conversationId,
    messageContainer,
    onMessageNotFound = () => {}
} = {}) {
    let currentConversationId = cleanId(conversationId);

    if (!currentConversationId) {
        throw new Error("Conversation ID is required.");
    }

    if (
        !messageContainer?.addEventListener ||
        !messageContainer?.querySelector
    ) {
        throw new Error("Message container is required.");
    }

    let container = messageContainer;
    let missingMessageCallback = typeof onMessageNotFound === "function"
        ? onMessageNotFound
        : () => {};
    let destroyed = false;
    const highlightTimers = new Map();
    const timerHost =
        messageContainer.ownerDocument?.defaultView || globalThis;

    function findMessage(messageId) {
        const cleanMessageId = cleanId(messageId);

        if (!cleanMessageId || !container) {
            return null;
        }

        return container.querySelector(
            `[data-message-id="${escapeAttributeValue(cleanMessageId)}"]`
        );
    }

    function restoreElement(element, previousTabIndex, previousAriaLabel) {
        element.classList.remove("message--highlight");

        if (previousTabIndex === null) {
            element.removeAttribute("tabindex");
        } else {
            element.setAttribute("tabindex", previousTabIndex);
        }

        if (previousAriaLabel === null) {
            element.removeAttribute("aria-label");
        } else {
            element.setAttribute("aria-label", previousAriaLabel);
        }
    }

    function clearHighlight(messageId) {
        const activeHighlight = highlightTimers.get(messageId);

        if (!activeHighlight) {
            return;
        }

        timerHost.clearTimeout(activeHighlight.timer);
        restoreElement(
            activeHighlight.element,
            activeHighlight.previousTabIndex,
            activeHighlight.previousAriaLabel
        );
        highlightTimers.delete(messageId);
    }

    function highlightMessage(messageId) {
        const cleanMessageId = cleanId(messageId);
        const element = findMessage(cleanMessageId);

        if (!element || destroyed) {
            return false;
        }

        clearHighlight(cleanMessageId);

        const previousTabIndex = element.getAttribute("tabindex");
        const previousAriaLabel = element.getAttribute("aria-label");

        element.classList.add("message--highlight");
        element.setAttribute("tabindex", "-1");
        element.setAttribute("aria-label", "Original message");
        element.focus?.({ preventScroll: true });

        const timer = timerHost.setTimeout(() => {
            restoreElement(
                element,
                previousTabIndex,
                previousAriaLabel
            );
            highlightTimers.delete(cleanMessageId);
        }, HIGHLIGHT_DURATION);

        highlightTimers.set(cleanMessageId, {
            element,
            previousTabIndex,
            previousAriaLabel,
            timer
        });

        return true;
    }

    async function scrollToMessage(messageId) {
        const cleanMessageId = cleanId(messageId);

        if (!cleanMessageId || destroyed) {
            return false;
        }

        let element = findMessage(cleanMessageId);

        if (!element) {
            await missingMessageCallback(cleanMessageId);

            if (destroyed) {
                return false;
            }

            element = findMessage(cleanMessageId);
        }

        if (!element) {
            return false;
        }

        element.scrollIntoView({
            behavior: shouldReduceMotion() ? "auto" : "smooth",
            block: "center"
        });
        highlightMessage(cleanMessageId);

        return true;
    }

    function getReplyMessageId(replyPreview) {
        return cleanId(
            replyPreview?.dataset?.replyMessageId ||
            replyPreview?.dataset?.messageId
        );
    }

    function shouldReduceMotion() {
        const documentReference = container?.ownerDocument;

        if (
            documentReference?.documentElement?.dataset
                ?.reducedMotion === "true"
        ) {
            return true;
        }

        return documentReference?.defaultView
            ?.matchMedia?.("(prefers-reduced-motion: reduce)")
            ?.matches === true;
    }

    function handleClick(event) {
        const replyPreview = event.target?.closest?.(".reply-preview");
        const messageId = getReplyMessageId(replyPreview);

        if (!replyPreview || !messageId) {
            return;
        }

        event.preventDefault();
        void scrollToMessage(messageId).catch((error) => {
            logError(error, "Unable to navigate to original message");
        });
    }

    function handleKeydown(event) {
        const replyPreview = event.target?.closest?.(".reply-preview");

        if (
            !replyPreview ||
            !["Enter", " "].includes(event.key) ||
            ["BUTTON", "A"].includes(replyPreview.tagName)
        ) {
            return;
        }

        event.preventDefault();
        void scrollToMessage(
            getReplyMessageId(replyPreview)
        ).catch((error) => {
            logError(error, "Unable to navigate to original message");
        });
    }

    function destroy() {
        if (destroyed) {
            return;
        }

        destroyed = true;
        container.removeEventListener("click", handleClick);
        container.removeEventListener("keydown", handleKeydown);
        [...highlightTimers.keys()].forEach(clearHighlight);
        highlightTimers.clear();
        currentConversationId = "";
        missingMessageCallback = null;
        container = null;
    }

    container.addEventListener("click", handleClick);
    container.addEventListener("keydown", handleKeydown);

    return {
        scrollToMessage,
        highlightMessage,
        destroy
    };
}
