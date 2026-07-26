import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bindContextMenuInteractions } from "../js/components/context-menu.js";

const source = readFileSync(
    new URL("../js/components/context-menu.js", import.meta.url),
    "utf8"
);

test("context menu stays generic and emits selected action IDs", () => {
    assert.match(source, /normalizeItems/);
    assert.match(source, /onSelect\(action\)/);
    assert.match(source, /dataset\.contextMenuAction/);
    assert.doesNotMatch(
        source,
        /conversation|pinConversation|muteConversation|archiveConversation/
    );
});

test("context menu constrains placement to the viewport", () => {
    assert.match(source, /window\.innerWidth/);
    assert.match(source, /window\.innerHeight/);
    assert.match(source, /getBoundingClientRect/);
});

test("context menu owns keyboard focus and cleanup", () => {
    assert.match(source, /ArrowDown/);
    assert.match(source, /ArrowUp/);
    assert.match(source, /Escape/);
    assert.match(source, /trigger\.focus\(\)/);
    assert.match(source, /menu\.remove\(\)/);
});

test("context menu supports pointer and long-press interactions", () => {
    assert.match(source, /export function bindContextMenuInteractions\(/);
    assert.match(source, /contextmenu/);
    assert.match(source, /pointerdown/);
    assert.match(source, /\["touch", "pen"\]/);
    assert.match(source, /longPressDuration = 550/);
    assert.match(source, /movementTolerance = 10/);
    assert.match(source, /destroyContextMenuInteractions/);
});

test("long press opens the context menu and cleanup removes listeners", async () => {
    const listeners = new Map();
    const target = { id: "message-1" };
    const eventTarget = {
        closest(selector) {
            return selector === "[data-message]" ? target : null;
        }
    };
    const container = {
        addEventListener(type, listener) {
            const handlers = listeners.get(type) || [];
            handlers.push(listener);
            listeners.set(type, handlers);
        },
        removeEventListener(type, listener) {
            listeners.set(
                type,
                (listeners.get(type) || []).filter(
                    (handler) => handler !== listener
                )
            );
        },
        dispatch(type, details = {}) {
            (listeners.get(type) || []).forEach((listener) => {
                listener({
                    target: eventTarget,
                    preventDefault() {},
                    stopPropagation() {},
                    ...details
                });
            });
        }
    };
    let opened = null;
    const destroy = bindContextMenuInteractions({
        container,
        targetSelector: "[data-message]",
        longPressDuration: 5,
        onOpen(details) {
            opened = details;
        }
    });

    container.dispatch("pointerdown", {
        pointerType: "touch",
        clientX: 24,
        clientY: 36
    });
    await new Promise((resolve) => setTimeout(resolve, 15));

    assert.equal(opened.target, target);
    assert.equal(opened.inputType, "touch");
    assert.equal(opened.x, 24);
    assert.equal(opened.y, 36);

    destroy();

    assert.equal(
        [...listeners.values()].every((handlers) => handlers.length === 0),
        true
    );
});
