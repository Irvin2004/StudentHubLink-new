export const RESOURCE_STATUS = {
    PENDING: "pending",

    APPROVED: "approved",

    REJECTED: "rejected"
};

export const TRANSACTION_STATUS = {
    COMPLETED: "completed"
};

export const RESOURCE_ACTION = {
    DOWNLOAD: "download",

    PURCHASE: "purchase"
};

export const REVIEW_ACTION = {
    APPROVE: "approve",

    REJECT: "reject"
};

export { MESSAGE_TYPES } from "../config/message-types.js";

export function getResourceAction(resource) {
    return Number(resource?.price || 0) > 0
        ? RESOURCE_ACTION.PURCHASE
        : RESOURCE_ACTION.DOWNLOAD;
}

export function getResourceActionLabel(action) {
    return action === RESOURCE_ACTION.PURCHASE ? "Purchased" : "Downloaded";
}

export function getResourceActionPastTense(action) {
    return action === RESOURCE_ACTION.PURCHASE ? "purchased" : "downloaded";
}

export function getReviewStatus(action) {
    return action === REVIEW_ACTION.APPROVE
        ? RESOURCE_STATUS.APPROVED
        : RESOURCE_STATUS.REJECTED;
}
