import test from "node:test";
import assert from "node:assert/strict";

import { NOTIFICATION_TYPES } from "../js/config/notification-types.js";
import { createCommentModel } from "../js/models/comment.js";
import { createNotificationModel } from "../js/models/notification.js";
import { createReviewModel } from "../js/models/review.js";
import { sanitizeUrl } from "../js/utils/validators.js";

test("notification model preserves deep-link context", () => {
    assert.deepEqual(
        createNotificationModel({
            type: NOTIFICATION_TYPES.NEW_MESSAGE,
            title: " New Message ",
            message: " Alex sent a new message. ",
            recipientId: " recipient ",
            senderId: " sender ",
            conversationId: " chat-1 ",
            referenceId: " message-1 "
        }),
        {
            type: "new_message",
            title: "New Message",
            message: "Alex sent a new message.",
            recipientId: "recipient",
            senderId: "sender",
            groupId: null,
            conversationId: "chat-1",
            referenceId: "message-1",
            read: false
        }
    );
});

test("review and comment models reject invalid content", () => {
    assert.throws(
        () =>
            createReviewModel({
                resourceId: "resource",
                userId: "user",
                rating: 6,
                review: "Bad"
            }),
        /1 to 5/
    );
    assert.throws(
        () =>
            createCommentModel({
                resourceId: "resource",
                userId: "user",
                message: "   "
            }),
        /required/
    );
});

test("resource links reject executable URL schemes", () => {
    assert.equal(sanitizeUrl("javascript:alert(1)"), "#");
    assert.equal(
        sanitizeUrl("https://example.com/file.pdf"),
        "https://example.com/file.pdf"
    );
});
