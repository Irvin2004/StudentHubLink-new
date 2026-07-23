import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
    createEmptyState
} from "../js/components/empty-state.js";
import {
    EMPTY_STATE_TYPES
} from "../js/config/empty-state-types.js";
import {
    hideEmptyState,
    showEmptyState
} from "../js/renderers/empty-state-renderer.js";

function read(path) {
    return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function createContainer() {
    const attributes = new Map();
    const listeners = new Map();
    const actionButton = {
        addEventListener(type, callback) {
            listeners.set(type, callback);
        },
        removeEventListener(type, callback) {
            if (listeners.get(type) === callback) {
                listeners.delete(type);
            }
        }
    };
    const root = {
        removed: false,
        querySelector(selector) {
            return selector === "[data-empty-state-action]"
                ? actionButton
                : null;
        },
        remove() {
            this.removed = true;
        }
    };

    return {
        innerHTML: "",
        root,
        listeners,
        setAttribute(name, value) {
            attributes.set(name, String(value));
        },
        getAttribute(name) {
            return attributes.get(name) ?? null;
        },
        querySelector(selector) {
            return selector === "[data-empty-state-root]" &&
                this.innerHTML.includes("data-empty-state-root")
                ? root
                : null;
        }
    };
}

test("empty state types are centralized and immutable", () => {
    assert.deepEqual(EMPTY_STATE_TYPES, {
        MESSAGES: "messages",
        COMMUNITIES: "communities",
        CHANNELS: "channels",
        SEARCH: "search",
        FILES: "files",
        NOTIFICATIONS: "notifications",
        FRIENDS: "friends"
    });
    assert.equal(Object.isFrozen(EMPTY_STATE_TYPES), true);
});

test("empty state component renders accessible typed defaults", () => {
    const html = createEmptyState({
        type: EMPTY_STATE_TYPES.MESSAGES,
        action: {
            label: "Send Message",
            ariaLabel: "Send the first message"
        }
    });

    assert.match(html, /data-empty-state-type="messages"/);
    assert.match(html, /aria-live="polite"/);
    assert.match(html, /aria-atomic="true"/);
    assert.match(html, /aria-hidden="true"/);
    assert.match(html, /No messages yet/);
    assert.match(html, /data-empty-state-action/);
    assert.match(html, /aria-label="Send the first message"/);
});

test("empty state renderer owns action listeners and cleanup", () => {
    const container = createContainer();
    let actionCount = 0;

    const root = showEmptyState({
        container,
        type: EMPTY_STATE_TYPES.FILES,
        action: {
            label: "Upload File",
            onClick() {
                actionCount += 1;
            }
        }
    });

    assert.equal(container.getAttribute("aria-busy"), "false");
    container.listeners.get("click")?.({});
    assert.equal(actionCount, 1);

    hideEmptyState(container);
    assert.equal(root.removed, true);
    assert.equal(container.listeners.has("click"), false);
});

test("empty state styles are theme-aware and motion-safe", () => {
    const styles = read("css/components/empty-state.css");
    const renderer = read("js/renderers/empty-state-renderer.js");

    assert.match(styles, /--empty-icon/);
    assert.match(styles, /--empty-title/);
    assert.match(styles, /--empty-description/);
    assert.match(styles, /data-reduced-motion="true"/);
    assert.match(styles, /prefers-reduced-motion: reduce/);
    assert.doesNotMatch(renderer, /firebase|firestore|service/i);
});
