import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("application shell composes layout components around Router Outlet", () => {
    const layout = read("src/components/layout/AppLayout/AppLayout.jsx");
    const router = read("src/routes/AppRouter.jsx");

    assert.match(layout, /<MobileDrawer/);
    assert.match(layout, /<Sidebar/);
    assert.match(layout, /<Topbar/);
    assert.match(layout, /<Outlet \/>/);
    assert.match(router, /<Route element=\{<AppLayout \/>\}>/);
    assert.doesNotMatch(layout, /firebase|firestore|DashboardPage/);
});

test("sidebar provides every requested route and keyboard interaction", () => {
    const sidebar = read("src/components/layout/Sidebar/Sidebar.jsx");

    for (const label of [
        "Home",
        "Communities",
        "Messages",
        "Files",
        "Notifications",
        "Settings"
    ]) {
        assert.match(sidebar, new RegExp(`label: "${label}"`));
    }

    assert.match(sidebar, /NavLink/);
    assert.match(sidebar, /ArrowUp/);
    assert.match(sidebar, /ArrowDown/);
    assert.match(sidebar, /event\.key === " "/);
});

test("mobile drawer owns focus management and cleanup", () => {
    const drawer = read("src/components/layout/MobileDrawer/MobileDrawer.jsx");

    assert.match(drawer, /FOCUSABLE_SELECTOR/);
    assert.match(drawer, /event\.key === "Escape"/);
    assert.match(drawer, /document\.addEventListener\("keydown"/);
    assert.match(drawer, /document\.removeEventListener\("keydown"/);
    assert.match(drawer, /returnFocusElement\?\.focus\(\)/);
});

test("responsive breakpoints and theme choices are centralized", () => {
    const breakpoints = read("src/config/breakpoints.js");
    const topbar = read("src/components/layout/Topbar/Topbar.jsx");

    assert.match(breakpoints, /MOBILE: 768/);
    assert.match(breakpoints, /TABLET: 1024/);
    assert.match(topbar, /\["system", "light", "dark"\]/);
    assert.match(topbar, /setTheme\(nextTheme\)/);
});
