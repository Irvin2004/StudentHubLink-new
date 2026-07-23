import test from "node:test";
import assert from "node:assert/strict";

import {
    compareConversations,
    sortConversations
} from "../js/utils/conversation-sorter.js";

function conversation(id, timestamp, title = id) {
    return {
        id,
        title,
        lastMessageAt: { toMillis: () => timestamp }
    };
}

test("conversation sorter places pinned conversations first", () => {
    const conversations = [
        conversation("recent", 300),
        conversation("pinned", 100)
    ];
    const preferences = [
        { conversationId: "pinned", pinned: true }
    ];

    assert.deepEqual(
        sortConversations(conversations, preferences).map(({ id }) => id),
        ["pinned", "recent"]
    );
});

test("conversation sorter orders each section by recent activity", () => {
    const conversations = [
        conversation("older", 100),
        conversation("newer", 300),
        conversation("middle", 200)
    ];

    assert.deepEqual(
        sortConversations(conversations).map(({ id }) => id),
        ["newer", "middle", "older"]
    );
});

test("conversation sorter uses display title as a stable tie-breaker", () => {
    const conversations = [
        {
            conversation: conversation("z-id", 100),
            otherUser: { displayName: "Alice" }
        },
        {
            conversation: conversation("a-id", 100),
            otherUser: { displayName: "Zola" }
        }
    ];

    assert.deepEqual(
        sortConversations(conversations).map(
            ({ conversation: item }) => item.id
        ),
        ["z-id", "a-id"]
    );
});

test("conversation sorter handles missing preferences and empty lists", () => {
    assert.deepEqual(sortConversations([], undefined), []);
    assert.equal(
        compareConversations(
            conversation("alpha", 100, "Alpha"),
            conversation("beta", 100, "Beta")
        ),
        -1
    );
});

test("conversation sorter uses IDs when titles are identical", () => {
    const conversations = [
        conversation("group-20", 100, "Study Group"),
        conversation("group-3", 100, "Study Group")
    ];

    assert.deepEqual(
        sortConversations(conversations).map(({ id }) => id),
        ["group-3", "group-20"]
    );
});

test("conversation sorter can disable pin priority for archived views", () => {
    const conversations = [
        conversation("recent", 300),
        conversation("pinned-old", 100)
    ];
    const preferences = new Map([
        ["pinned-old", { pinned: true }]
    ]);

    assert.deepEqual(
        sortConversations(conversations, preferences, {
            prioritizePinned: false
        }).map(({ id }) => id),
        ["recent", "pinned-old"]
    );
});
