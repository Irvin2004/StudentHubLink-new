import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
    createSkeleton
} from "../js/components/skeleton.js";
import {
    SKELETON_TYPES
} from "../js/config/skeleton-types.js";
import {
    destroySkeleton,
    hideSkeleton,
    showSkeleton
} from "../js/renderers/skeleton-renderer.js";

function read(path) {
    return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function createContainer({ mobile = false } = {}) {
    const attributes = new Map();
    const container = {
        innerHTML: "",
        isConnected: true,
        ownerDocument: {
            defaultView: {
                matchMedia() {
                    return { matches: mobile };
                }
            }
        },
        setAttribute(name, value) {
            attributes.set(name, String(value));
        },
        getAttribute(name) {
            return attributes.get(name) ?? null;
        },
        querySelector(selector) {
            if (
                selector !== "[data-skeleton-root]" ||
                !this.innerHTML.includes("data-skeleton-root")
            ) {
                return null;
            }

            return {
                remove: () => {
                    this.innerHTML = "";
                }
            };
        }
    };

    return container;
}

test("skeleton component supports every centralized layout", () => {
    assert.deepEqual(SKELETON_TYPES, {
        MESSAGE: "message",
        COMMUNITY: "community",
        CHANNEL: "channel",
        USER: "user",
        PROFILE: "profile",
        FILE: "file",
        NOTIFICATION: "notification"
    });
    assert.equal(Object.isFrozen(SKELETON_TYPES), true);

    Object.values(SKELETON_TYPES).forEach((type) => {
        const html = createSkeleton(type, { count: 2 });

        assert.match(html, new RegExp(`data-skeleton-type="${type}"`));
        assert.match(html, /aria-hidden="true"/);
        assert.equal(
            (html.match(/class="skeleton-item/g) || []).length,
            2
        );
    });
});

test("message skeleton renders fewer placeholders on mobile", () => {
    const desktop = createContainer();
    const mobile = createContainer({ mobile: true });

    showSkeleton(desktop, SKELETON_TYPES.MESSAGE);
    showSkeleton(mobile, SKELETON_TYPES.MESSAGE);

    assert.equal(
        (desktop.innerHTML.match(/skeleton-message(?: |")/g) || []).length,
        8
    );
    assert.equal(
        (mobile.innerHTML.match(/skeleton-message(?: |")/g) || []).length,
        5
    );
});

test("skeleton renderer manages busy state and cleanup", () => {
    const first = createContainer();
    const second = createContainer();

    showSkeleton(first, SKELETON_TYPES.USER);
    showSkeleton(second, SKELETON_TYPES.NOTIFICATION);
    assert.equal(first.getAttribute("aria-busy"), "true");

    hideSkeleton(first);
    assert.equal(first.getAttribute("aria-busy"), "false");
    assert.equal(first.innerHTML, "");

    destroySkeleton();
    assert.equal(second.getAttribute("aria-busy"), "false");
    assert.equal(second.innerHTML, "");
});

test("skeleton presentation is theme-aware and motion-safe", () => {
    const component = read("js/components/skeleton.js");
    const renderer = read("js/renderers/skeleton-renderer.js");
    const styles = read("css/components/skeleton.css");

    assert.doesNotMatch(component, /firebase|firestore|controller/i);
    assert.doesNotMatch(renderer, /firebase|firestore|controller/i);
    assert.match(styles, /--skeleton-base/);
    assert.match(styles, /--skeleton-highlight/);
    assert.match(styles, /studenthub-skeleton-shimmer 1\.2s/);
    assert.match(styles, /data-reduced-motion="true"/);
    assert.match(styles, /prefers-reduced-motion: reduce/);
});
