import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
    BREAKPOINTS,
    isMobileViewport,
    isTabletViewport
} from "../js/utils/breakpoints.js";

const read = (path) =>
    readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("responsive breakpoints are centralized and immutable", () => {
    assert.deepEqual(BREAKPOINTS, {
        MOBILE: 768,
        TABLET: 1024
    });
    assert.equal(Object.isFrozen(BREAKPOINTS), true);
    assert.equal(isMobileViewport(767), true);
    assert.equal(isMobileViewport(768), false);
    assert.equal(isTabletViewport(768), true);
    assert.equal(isTabletViewport(1023), true);
    assert.equal(isTabletViewport(1024), false);
});

test("navigation drawer owns state, focus, and cleanup only", () => {
    const drawer = read("js/components/navigation-drawer.js");

    assert.match(drawer, /export function createNavigationDrawer\(/);
    assert.match(drawer, /function open\(\)/);
    assert.match(drawer, /function close\(/);
    assert.match(drawer, /function toggle\(\)/);
    assert.match(drawer, /event\.key === "Escape"/);
    assert.match(drawer, /event\.key !== "Tab"/);
    assert.match(drawer, /backdrop\.addEventListener\("click", close\)/);
    assert.match(drawer, /toggleButton\.focus\(\)/);
    assert.match(drawer, /destroy\(\)/);
    assert.doesNotMatch(
        drawer,
        /firebase|firestore|service|innerHTML|insertAdjacentHTML/
    );
});

test("responsive CSS covers tablet, mobile, touch, and bottom sheets", () => {
    const responsive = read("css/layout/responsive.css");

    assert.match(responsive, /min-width: 768px\) and \(max-width: 1023px/);
    assert.match(responsive, /max-width: 767px/);
    assert.match(responsive, /grid-template-columns: 80px/);
    assert.match(responsive, /translateX\(-105%\)/);
    assert.match(responsive, /min-width: 44px/);
    assert.match(responsive, /min-height: 44px/);
    assert.match(responsive, /max-width: 100%/);
    assert.match(responsive, /place-items: end center/);
    assert.match(responsive, /orientation: landscape/);
});
