"use strict";

import {
    addReaction,
    removeReaction,
    subscribeToReactions
} from "../services/message-service.js?reactions=1";
import {
    createReactionPicker,
    destroyReactionPicker,
    openReactionPicker
} from "../components/reaction-picker.js?reactions=2";
import {
    clearReactionBar,
    renderReactionBar
} from "../renderers/reaction-renderer.js?reactions=1";
import { handleError } from "../utils/error-handler.js?security=1";

function cleanId(value) {
    return typeof value === "string" ? value.trim() : "";
}

function getMessageId(element) {
    return cleanId(
        element?.dataset?.messageId ||
        element?.closest?.("[data-message-id]")?.dataset?.messageId
    );
}

export function initializeReactions({
    conversationId,
    currentUserId,
    messageContainer
}) {
    const cleanConversationId = cleanId(conversationId);
    const cleanCurrentUserId = cleanId(currentUserId);

    if (!cleanConversationId) {
        throw new Error("Conversation ID is required.");
    }

    if (!cleanCurrentUserId) {
        throw new Error("Current user ID is required.");
    }

    if (!messageContainer?.addEventListener) {
        throw new Error("Message container is required.");
    }

    const subscriptions = new Map();
    const reactionsByMessage = new Map();
    let destroyed = false;

    function reportReactionError(error) {
        handleError(error, "Unable to update reaction.");
    }

    function getCurrentReaction(messageId) {
        return reactionsByMessage.get(messageId)?.find(
            ({ userId }) => userId === cleanCurrentUserId
        )?.reaction || "";
    }

    async function updateReaction(messageId, reaction) {
        if (!messageId || !reaction || destroyed) return;

        try {
            if (getCurrentReaction(messageId) === reaction) {
                await removeReaction(
                    cleanConversationId,
                    messageId,
                    cleanCurrentUserId
                );
                return;
            }

            await addReaction(
                cleanConversationId,
                messageId,
                cleanCurrentUserId,
                reaction
            );
        } catch (error) {
            reportReactionError(error);
        }
    }

    function showPicker(messageId, anchorElement) {
        if (!messageId || !anchorElement) return;

        createReactionPicker({
            currentReaction: getCurrentReaction(messageId),
            onSelect(reaction) {
                updateReaction(messageId, reaction);
            }
        });
        openReactionPicker(anchorElement);
    }

    function handleMessageClick(event) {
        if (!(event.target instanceof Element)) return;

        const chip = event.target.closest(
            ".reaction-chip[data-reaction]"
        );

        if (chip && messageContainer.contains(chip)) {
            updateReaction(
                getMessageId(chip),
                chip.dataset.reaction
            );
            return;
        }

        const trigger = event.target.closest(
            '[data-message-action="react"]'
        );

        if (trigger && messageContainer.contains(trigger)) {
            showPicker(getMessageId(trigger), trigger);
        }
    }

    function handleMenuClick(event) {
        if (!(event.target instanceof Element)) return;

        const trigger = event.target.closest(
            '#messageMenu [data-action="react"]'
        );

        if (!trigger) return;

        const menu = trigger.closest("#messageMenu");
        const messageId = cleanId(menu?.dataset?.messageId);

        showPicker(messageId, trigger);
    }

    function renderMessageReactions(reactions, container) {
        if (!container?.isConnected) return;

        if (reactions.length) {
            renderReactionBar(
                reactions,
                cleanCurrentUserId,
                container
            );
            return;
        }

        clearReactionBar(container);
    }

    function subscribeToMessage(messageId, container) {
        const subscription = {
            container,
            unsubscribe: () => {}
        };

        subscriptions.set(messageId, subscription);
        subscription.unsubscribe = subscribeToReactions(
            cleanConversationId,
            messageId,
            (reactions) => {
                if (destroyed) return;

                reactionsByMessage.set(messageId, reactions);
                const activeSubscription = subscriptions.get(messageId);

                if (activeSubscription) {
                    renderMessageReactions(
                        reactions,
                        activeSubscription.container
                    );
                }
            },
            (error) => {
                console.error("Reaction listener failed:", error);
            }
        );
    }

    function synchronizeSubscriptions() {
        if (destroyed) return;

        const activeMessageIds = new Set();
        const containers = messageContainer.querySelectorAll(
            "[data-reaction-container][data-message-id]"
        );

        containers.forEach((container) => {
            const messageId = getMessageId(container);

            if (!messageId) return;

            activeMessageIds.add(messageId);

            const existing = subscriptions.get(messageId);

            if (existing) {
                if (existing.container !== container) {
                    existing.container = container;
                    renderMessageReactions(
                        reactionsByMessage.get(messageId) || [],
                        container
                    );
                }
                return;
            }

            subscribeToMessage(messageId, container);
        });

        subscriptions.forEach((subscription, messageId) => {
            if (activeMessageIds.has(messageId)) return;

            subscription.unsubscribe();
            subscriptions.delete(messageId);
            reactionsByMessage.delete(messageId);
        });
    }

    const observer = new MutationObserver(synchronizeSubscriptions);

    messageContainer.addEventListener("click", handleMessageClick);
    document.addEventListener("click", handleMenuClick, true);
    observer.observe(messageContainer, {
        childList: true,
        subtree: true
    });
    synchronizeSubscriptions();

    return {
        destroy() {
            if (destroyed) return;
            destroyed = true;

            observer.disconnect();
            messageContainer.removeEventListener(
                "click",
                handleMessageClick
            );
            document.removeEventListener("click", handleMenuClick, true);
            subscriptions.forEach(({ unsubscribe }) => unsubscribe());
            subscriptions.clear();
            reactionsByMessage.clear();
            destroyReactionPicker();
        }
    };
}
