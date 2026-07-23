import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

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
