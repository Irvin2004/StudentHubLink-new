import test from "node:test";
import assert from "node:assert/strict";

import {
    renderConversationList
} from "../js/renderers/conversation-renderer.js";
import {
    createConversationMenu
} from "../js/components/conversation-menu.js";

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
    assert.ok(
        container.innerHTML.indexOf("Pinned") <
        container.innerHTML.indexOf("Recent")
    );
});

test("conversation menu exposes dynamic pin and mute actions", () => {
    const html = createConversationMenu({
        conversationId: "conversation-1",
        preference: { pinned: true, muted: true }
    });

    assert.match(html, /data-conversation-action="pinned"/);
    assert.match(html, />&#128204; Unpin</);
    assert.match(html, /data-conversation-action="muted"/);
    assert.match(html, /aria-label="Unmute conversation"/);
    assert.match(html, />&#128276; Unmute</);
    assert.match(html, /Archive/);
    assert.match(html, /aria-haspopup="menu"/);
});

test("conversation menu restores archived conversations to the inbox", () => {
    const html = createConversationMenu({
        conversationId: "conversation-1",
        preference: { archived: true }
    });

    assert.match(html, /data-conversation-action="archived"/);
    assert.match(html, /aria-label="Move conversation to inbox"/);
    assert.match(html, />&#128228; Move to Inbox</);
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
