import { NOTIFICATION_TYPES } from "../config/notification-types.js";
import { createNotification } from "../services/notification-service.js";
import { error as logError } from "../utils/logger.js";

async function deliverFriendNotification(notification, eventName) {
    try {
        await createNotification(notification);

        return {
            recipients: 1,
            delivered: 1,
            failed: 0
        };
    } catch (error) {
        logError(
            "NOTIFICATIONS",
            `${eventName} notification failed:`,
            error
        );

        return {
            recipients: 1,
            delivered: 0,
            failed: 1
        };
    }
}

export async function emitFriendRequestSent({
    senderId,
    recipientId,
    requestId
} = {}) {
    return deliverFriendNotification(
        {
            type: NOTIFICATION_TYPES.FRIEND_REQUEST,
            recipientId,
            senderId,
            referenceId: requestId,
            title: "New Friend Request",
            message: "You received a new friend request."
        },
        "Friend request"
    );
}

export async function emitFriendRequestAccepted({
    senderId,
    recipientId,
    requestId
} = {}) {
    return deliverFriendNotification(
        {
            type: NOTIFICATION_TYPES.FRIEND_ACCEPTED,
            recipientId: senderId,
            senderId: recipientId,
            referenceId: requestId,
            title: "Friend Request Accepted",
            message: "Your friend request has been accepted."
        },
        "Friend request accepted"
    );
}
