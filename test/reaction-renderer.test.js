import test from "node:test";
import assert from "node:assert/strict";

import { REACTION_TYPES } from "../js/config/reaction-types.js";
import {
    clearReactionBar,
    renderReactionBar,
    renderReactionChip
} from "../js/renderers/reaction-renderer.js";

function createContainer(messageId = "message-1") {
    const classes = new Set();
    const attributes = new Map();

    return {
        innerHTML: "",
        dataset: { messageId },
        classList: {
            add: (name) => classes.add(name),
            remove: (name) => classes.delete(name),
            contains: (name) => classes.has(name)
        },
        removeAttribute: (name) => attributes.delete(name),
        setAttribute: (name, value) => attributes.set(name, value),
        hasAttribute: (name) => attributes.has(name)
    };
}

test("reaction renderer groups emoji and highlights the current user", () => {
    const container = createContainer();
    const html = renderReactionBar(
        [
            { userId: "user-1", reaction: REACTION_TYPES.LOVE },
            { userId: "user-2", reaction: REACTION_TYPES.LOVE },
            { userId: "user-2", reaction: REACTION_TYPES.LOVE },
            { userId: "user-3", reaction: REACTION_TYPES.LIKE },
            { userId: "user-4", reaction: "invalid" }
        ],
        "user-1",
        container
    );

    assert.equal(container.classList.contains("reaction-bar"), true);
    assert.match(html, /class="reaction-chip mine"/);
    assert.match(html, /data-message-id="message-1"/);
    assert.match(html, /data-reaction="❤️"/);
    assert.match(html, /<span class="reaction-count">2<\/span>/);
    assert.equal((html.match(/class="reaction-chip/g) || []).length, 2);
});

test("reaction renderer omits empty bars and rejects invalid chips", () => {
    const container = createContainer();

    assert.equal(renderReactionChip("invalid", 1, false), "");
    assert.equal(renderReactionBar([], "user-1", container), "");
    assert.equal(container.innerHTML, "");
    assert.equal(container.classList.contains("reaction-bar"), false);
    assert.equal(container.hasAttribute("hidden"), true);

    container.innerHTML = "old";
    clearReactionBar(container);
    assert.equal(container.innerHTML, "");
});
