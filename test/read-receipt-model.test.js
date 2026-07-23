import test from "node:test";
import assert from "node:assert/strict";

import {
    MESSAGE_STATUS,
    isValidMessageStatus
} from "../js/config/message-status.js";
import {
    createReadReceiptModel,
    validateReadReceipt
} from "../js/models/read-receipt.js";

test("message statuses are frozen, unique, and valid", () => {
    const values = Object.values(MESSAGE_STATUS);

    assert.equal(Object.isFrozen(MESSAGE_STATUS), true);
    assert.equal(new Set(values).size, values.length);
    assert.deepEqual(values, ["sent", "delivered", "read"]);
    values.forEach((status) => {
        assert.equal(isValidMessageStatus(status), true);
    });
    assert.equal(isValidMessageStatus("sending"), false);
});

test("read receipt model trims IDs and leaves timestamp to service", () => {
    assert.deepEqual(
        createReadReceiptModel({
            conversationId: " conversation-1 ",
            messageId: " message-1 ",
            userId: " user-1 ",
            readAt: new Date()
        }),
        {
            conversationId: "conversation-1",
            messageId: "message-1",
            userId: "user-1",
            readAt: null
        }
    );
});

test("read receipt validation reports every missing ID", () => {
    const validation = validateReadReceipt({});

    assert.equal(validation.isValid, false);
    assert.deepEqual(Object.keys(validation.errors).sort(), [
        "conversationId",
        "messageId",
        "userId"
    ]);
    assert.throws(
        () => createReadReceiptModel({}),
        (error) =>
            Boolean(
                error.message === "Invalid read receipt data." &&
                error.validationErrors.conversationId &&
                error.validationErrors.messageId &&
                error.validationErrors.userId
            )
    );
});
