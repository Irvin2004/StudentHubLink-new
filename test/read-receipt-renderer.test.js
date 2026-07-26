import test from "node:test";
import assert from "node:assert/strict";

import { MESSAGE_STATUS } from "../js/config/message-status.js";
import {
    clearReadReceipt,
    renderMessageStatus,
    renderReadReceipt
} from "../js/renderers/read-receipt-renderer.js";

function createContainer() {
    const attributes = new Map();

    return {
        innerHTML: "",
        removeAttribute: (name) => attributes.delete(name),
        setAttribute: (name, value) => attributes.set(name, value),
        hasAttribute: (name) => attributes.has(name)
    };
}

test("message status renderer supports sent, delivered, and read", () => {
    const sent = renderMessageStatus(MESSAGE_STATUS.SENT);
    const delivered = renderMessageStatus(MESSAGE_STATUS.DELIVERED);
    const read = renderMessageStatus(MESSAGE_STATUS.READ);

    assert.match(sent, /message-status sent/);
    assert.match(sent, /aria-label="Message sent"/);
    assert.equal((sent.match(/&#10003;/g) || []).length, 1);
    assert.match(delivered, /message-status delivered/);
    assert.match(delivered, /aria-label="Message delivered"/);
    assert.equal((delivered.match(/&#10003;/g) || []).length, 2);
    assert.match(read, /message-status read/);
    assert.match(read, /aria-label="Message read"/);
});

test("read receipt renderer requires all group recipients", () => {
    const container = createContainer();
    const message = {
        senderId: "sender",
        expectedRecipientCount: 2
    };

    renderReadReceipt(
        [{ userId: "alice", status: MESSAGE_STATUS.READ }],
        "sender",
        message,
        container
    );
    assert.match(container.innerHTML, /message-status sent/);

    renderReadReceipt(
        [
            { userId: "alice", status: MESSAGE_STATUS.READ },
            { userId: "john", status: MESSAGE_STATUS.DELIVERED }
        ],
        "sender",
        message,
        container
    );
    assert.match(container.innerHTML, /message-status delivered/);

    renderReadReceipt(
        [
            { userId: "alice", status: MESSAGE_STATUS.READ },
            { userId: "john", status: MESSAGE_STATUS.READ }
        ],
        "sender",
        message,
        container
    );
    assert.match(container.innerHTML, /message-status read/);
});

test("read receipt renderer clears status for incoming messages", () => {
    const container = createContainer();
    container.innerHTML = "old";

    assert.equal(
        renderReadReceipt(
            [],
            "recipient",
            {
                senderId: "sender",
                receiverId: "recipient"
            },
            container
        ),
        ""
    );
    assert.equal(container.innerHTML, "");
    assert.equal(container.hasAttribute("hidden"), true);

    container.innerHTML = "old";
    clearReadReceipt(container);
    assert.equal(container.innerHTML, "");
});
