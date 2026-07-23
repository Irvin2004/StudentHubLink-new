import test from "node:test";
import assert from "node:assert/strict";

import {
    renderConversationList
} from "../js/renderers/conversation-renderer.js";

function item(id, timestamp, name) {
    return {
        conversation: {
            id,
            lastMessage: `${name} message`,
            lastMessageAt: { toMillis: () => timestamp },
            unreadCounts: {}
        },
        otherUser: { displayName: name }
    };
}

test("conversation renderer preserves prepared order and shows a divider", () => {
    const container = { innerHTML: "" };

    renderConversationList({
        items: [
            item("pinned", 100, "Pinned"),
            item("recent", 300, "Recent")
        ],
        currentUserId: "user-1",
        container,
        preferences: new Map([["pinned", { pinned: true }]])
    });

    assert.match(container.innerHTML, /Pinned conversation/);
    assert.match(container.innerHTML, /conversation-section-divider/);
    assert.match(container.innerHTML, /data-conversation-menu-trigger/);
    assert.ok(
        container.innerHTML.indexOf("Pinned") <
        container.innerHTML.indexOf("Recent")
    );
});

test("muted conversations show their state", () => {
    const items = [
        item("recent", 300, "Recent"),
        item("muted-old", 100, "Muted Old")
    ];
    const preferences = new Map([
        ["muted-old", { muted: true }]
    ]);
    const container = { innerHTML: "" };

    renderConversationList({
        items,
        currentUserId: "user-1",
        container,
        preferences
    });

    assert.match(container.innerHTML, /class="conversation-entry muted"/);
    assert.match(container.innerHTML, /aria-label="Conversation muted"/);
});
