import test from "node:test";
import assert from "node:assert/strict";

import {
    renderConversationList,
    sortConversationItems
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

test("conversation renderer sorts pinned first then by recent activity", () => {
    const items = [
        item("recent", 300, "Recent"),
        item("pinned-old", 100, "Pinned Old"),
        item("pinned-new", 200, "Pinned New")
    ];
    const preferences = new Map([
        ["pinned-old", { pinned: true }],
        ["pinned-new", { pinned: true }]
    ]);

    assert.deepEqual(
        sortConversationItems(items, preferences).map(
            ({ conversation }) => conversation.id
        ),
        ["pinned-new", "pinned-old", "recent"]
    );
});

test("conversation renderer shows pin indicators and a section divider", () => {
    const container = { innerHTML: "" };

    renderConversationList({
        items: [
            item("recent", 300, "Recent"),
            item("pinned", 100, "Pinned")
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

test("muted conversations stay in activity order and show their state", () => {
    const items = [
        item("recent", 300, "Recent"),
        item("muted-old", 100, "Muted Old")
    ];
    const preferences = new Map([
        ["muted-old", { muted: true }]
    ]);
    const container = { innerHTML: "" };

    assert.deepEqual(
        sortConversationItems(items, preferences).map(
            ({ conversation }) => conversation.id
        ),
        ["recent", "muted-old"]
    );

    renderConversationList({
        items,
        currentUserId: "user-1",
        container,
        preferences
    });

    assert.match(container.innerHTML, /class="conversation-entry muted"/);
    assert.match(container.innerHTML, /aria-label="Conversation muted"/);
});
