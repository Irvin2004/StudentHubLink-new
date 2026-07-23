"use strict";

import {
    markMessageDelivered,
    markMessageRead,
    subscribeToReadReceipts
} from "../services/message-service.js?receipts=2";
import { MESSAGE_STATUS } from "../config/message-status.js";
import {
    renderReadReceipt
} from "../renderers/read-receipt-renderer.js?receipts=1";

const READ_VISIBILITY_THRESHOLD = 0.6;

function cleanId(value) {
    return typeof value === "string" ? value.trim() : "";
}

function getCurrentUserReceipt(receipts, currentUserId) {
    return (Array.isArray(receipts) ? receipts : []).find(
        (receipt) => receipt?.userId === currentUserId
    );
}

function getExpectedRecipientCount(container) {
    const count = Number(container?.dataset?.expectedRecipientCount);
    return Number.isInteger(count) && count > 0 ? count : 1;
}

function isVisible(element) {
    if (!element?.getBoundingClientRect) return false;

    const rectangle = element.getBoundingClientRect();
    const visibleHeight = Math.max(
        0,
        Math.min(rectangle.bottom, window.innerHeight) -
            Math.max(rectangle.top, 0)
    );

    return rectangle.height > 0 &&
        visibleHeight / rectangle.height >= READ_VISIBILITY_THRESHOLD;
}

export function initializeReadReceipts({
    conversationId,
    currentUserId,
    messagesContainer
}) {
    const cleanConversationId = cleanId(conversationId);
    const cleanCurrentUserId = cleanId(currentUserId);

    if (!cleanConversationId) {
        throw new Error("Conversation ID is required.");
    }

    if (!cleanCurrentUserId) {
        throw new Error("Current user ID is required.");
    }

    if (!messagesContainer?.querySelectorAll) {
        throw new Error("Messages container is required.");
    }

    const subscriptions = new Map();
    const receiptsByMessage = new Map();
    const deliveryPromises = new Map();
    const readPending = new Set();
    const deliveredMessages = new Set();
    const readMessages = new Set();
    const observedRows = new Map();
    let destroyed = false;

    function reportError(action, error) {
        console.error(`Unable to ${action} message receipt:`, error);
    }

    function getReceipt(messageId) {
        return getCurrentUserReceipt(
            receiptsByMessage.get(messageId),
            cleanCurrentUserId
        );
    }

    function stopObserving(messageId) {
        const row = observedRows.get(messageId);

        if (row && intersectionObserver) {
            intersectionObserver.unobserve(row);
        }

        observedRows.delete(messageId);
    }

    async function ensureDelivered(messageId) {
        const receipt = getReceipt(messageId);

        if (
            destroyed ||
            receipt ||
            deliveredMessages.has(messageId) ||
            deliveryPromises.has(messageId)
        ) {
            return deliveryPromises.get(messageId);
        }

        const deliveryPromise = markMessageDelivered(
            cleanConversationId,
            messageId,
            cleanCurrentUserId
        )
            .then(() => deliveredMessages.add(messageId))
            .catch((error) => {
                reportError("mark as delivered", error);
            })
            .finally(() => deliveryPromises.delete(messageId));

        deliveryPromises.set(messageId, deliveryPromise);
        return deliveryPromise;
    }

    async function markVisibleMessageRead(messageId) {
        const receipt = getReceipt(messageId);

        if (
            destroyed ||
            receipt?.status === MESSAGE_STATUS.READ ||
            readMessages.has(messageId) ||
            readPending.has(messageId)
        ) {
            stopObserving(messageId);
            return;
        }

        readPending.add(messageId);

        try {
            await ensureDelivered(messageId);
            await markMessageRead(
                cleanConversationId,
                messageId,
                cleanCurrentUserId
            );
            readMessages.add(messageId);
            stopObserving(messageId);
        } catch (error) {
            reportError("mark as read", error);
        } finally {
            readPending.delete(messageId);
        }
    }

    function observeIncomingMessage(messageId, row) {
        if (readMessages.has(messageId)) return;

        const previousRow = observedRows.get(messageId);

        if (previousRow && previousRow !== row && intersectionObserver) {
            intersectionObserver.unobserve(previousRow);
        }

        observedRows.set(messageId, row);

        if (intersectionObserver) {
            intersectionObserver.observe(row);
        } else if (isVisible(row)) {
            markVisibleMessageRead(messageId);
        }
    }

    function handleIntersection(entries) {
        entries.forEach((entry) => {
            if (
                !entry.isIntersecting ||
                entry.intersectionRatio < READ_VISIBILITY_THRESHOLD
            ) {
                return;
            }

            const messageId = cleanId(entry.target?.dataset?.messageId);

            if (messageId) {
                markVisibleMessageRead(messageId);
            }
        });
    }

    const intersectionObserver = typeof IntersectionObserver === "function"
        ? new IntersectionObserver(handleIntersection, {
            root: messagesContainer,
            threshold: READ_VISIBILITY_THRESHOLD
        })
        : null;

    function updateMessage(subscription, receipts) {
        const currentReceipt = getCurrentUserReceipt(
            receipts,
            cleanCurrentUserId
        );

        receiptsByMessage.set(subscription.messageId, receipts);

        if (subscription.outgoing) {
            if (subscription.statusContainer?.isConnected) {
                renderReadReceipt(
                    receipts,
                    cleanCurrentUserId,
                    {
                        id: subscription.messageId,
                        senderId: cleanCurrentUserId,
                        expectedRecipientCount: getExpectedRecipientCount(
                            subscription.statusContainer
                        )
                    },
                    subscription.statusContainer
                );
            }
            return;
        }

        if (currentReceipt?.status === MESSAGE_STATUS.READ) {
            readMessages.add(subscription.messageId);
            stopObserving(subscription.messageId);
            return;
        }

        if (currentReceipt) {
            deliveredMessages.add(subscription.messageId);
        } else {
            ensureDelivered(subscription.messageId);
        }

        if (subscription.row?.isConnected) {
            observeIncomingMessage(subscription.messageId, subscription.row);
        }
    }

    function subscribeToMessage(messageId, row, outgoing, statusContainer) {
        const subscription = {
            messageId,
            row,
            outgoing,
            statusContainer,
            unsubscribe: () => {}
        };

        subscriptions.set(messageId, subscription);
        subscription.unsubscribe = subscribeToReadReceipts(
            cleanConversationId,
            messageId,
            (receipts) => {
                if (!destroyed) updateMessage(subscription, receipts);
            },
            (error) => reportError("subscribe to", error)
        );
    }

    function synchronizeMessages() {
        if (destroyed) return;

        const activeMessageIds = new Set();
        const rows = messagesContainer.querySelectorAll(
            ".message-row[data-message-id]"
        );

        rows.forEach((row) => {
            const messageId = cleanId(row.dataset.messageId);

            if (!messageId) return;

            activeMessageIds.add(messageId);
            const outgoing = row.classList.contains("mine");
            const statusContainer = outgoing
                ? row.querySelector("[data-read-receipt-container]")
                : null;
            const existing = subscriptions.get(messageId);

            if (existing) {
                existing.row = row;
                existing.outgoing = outgoing;
                existing.statusContainer = statusContainer;
                updateMessage(
                    existing,
                    receiptsByMessage.get(messageId) || []
                );
                return;
            }

            subscribeToMessage(
                messageId,
                row,
                outgoing,
                statusContainer
            );
        });

        subscriptions.forEach((subscription, messageId) => {
            if (activeMessageIds.has(messageId)) return;

            subscription.unsubscribe();
            stopObserving(messageId);
            subscriptions.delete(messageId);
            receiptsByMessage.delete(messageId);
            deliveryPromises.delete(messageId);
            readPending.delete(messageId);
            deliveredMessages.delete(messageId);
            readMessages.delete(messageId);
        });
    }

    const mutationObserver = new MutationObserver(synchronizeMessages);
    mutationObserver.observe(messagesContainer, {
        childList: true,
        subtree: true
    });
    synchronizeMessages();

    return {
        destroy() {
            if (destroyed) return;
            destroyed = true;

            intersectionObserver?.disconnect();
            mutationObserver.disconnect();
            subscriptions.forEach(({ unsubscribe }) => unsubscribe());
            subscriptions.clear();
            receiptsByMessage.clear();
            observedRows.clear();
            deliveryPromises.clear();
            readPending.clear();
            deliveredMessages.clear();
            readMessages.clear();
        }
    };
}
