"use strict";

import {
    MESSAGE_STATUS,
    isValidMessageStatus
} from "../config/message-status.js";

const STATUS_RANK = Object.freeze({
    [MESSAGE_STATUS.SENT]: 0,
    [MESSAGE_STATUS.DELIVERED]: 1,
    [MESSAGE_STATUS.READ]: 2
});

function requireContainer(container) {
    if (!container || !("innerHTML" in container)) {
        throw new Error("Read receipt container is required.");
    }
}

function getExpectedRecipientCount(message, receiptCount) {
    const configuredCount = Number(message?.expectedRecipientCount);

    if (Number.isInteger(configuredCount) && configuredCount > 0) {
        return configuredCount;
    }

    if (message?.receiverId) {
        return 1;
    }

    return Math.max(receiptCount, 1);
}

function getMessageStatus(receipts = [], message = {}) {
    const receiptsByUser = new Map();

    (Array.isArray(receipts) ? receipts : []).forEach((receipt) => {
        const userId = String(receipt?.userId || "").trim();
        const status = receipt?.status;

        if (
            !userId ||
            userId === message.senderId ||
            !isValidMessageStatus(status)
        ) {
            return;
        }

        const existing = receiptsByUser.get(userId);

        if (!existing || STATUS_RANK[status] > STATUS_RANK[existing]) {
            receiptsByUser.set(userId, status);
        }
    });

    const statuses = Array.from(receiptsByUser.values());
    const expectedCount = getExpectedRecipientCount(message, statuses.length);

    if (statuses.length < expectedCount) {
        return MESSAGE_STATUS.SENT;
    }

    if (statuses.every((status) => status === MESSAGE_STATUS.READ)) {
        return MESSAGE_STATUS.READ;
    }

    if (
        statuses.every(
            (status) =>
                status === MESSAGE_STATUS.DELIVERED ||
                status === MESSAGE_STATUS.READ
        )
    ) {
        return MESSAGE_STATUS.DELIVERED;
    }

    return MESSAGE_STATUS.SENT;
}

export function renderMessageStatus(status) {
    const cleanStatus = isValidMessageStatus(status)
        ? status
        : MESSAGE_STATUS.SENT;
    const isSent = cleanStatus === MESSAGE_STATUS.SENT;
    const icon = isSent ? "&#10003;" : "&#10003;&#10003;";
    const label = `Message ${cleanStatus}`;

    return `
        <div
            class="message-status ${cleanStatus}"
            role="status"
            aria-label="${label}"
        >
            <span class="status-icon" aria-hidden="true">
                ${icon}
            </span>
        </div>
    `;
}

export function renderReadReceipt(receipts, currentUserId, message, container) {
    requireContainer(container);

    if (!message || message.senderId !== currentUserId) {
        clearReadReceipt(container);
        return "";
    }

    const status = getMessageStatus(receipts, message);
    const html = renderMessageStatus(status);

    container.removeAttribute?.("hidden");
    container.innerHTML = html;
    return html;
}

export function clearReadReceipt(container) {
    requireContainer(container);
    container.innerHTML = "";
    container.setAttribute?.("hidden", "");
}
