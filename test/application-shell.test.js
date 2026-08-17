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
        "Resources",
        "Flashcards",
        "Quizzes",
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

test("legacy application URLs resolve to canonical React routes", () => {
    const router = read("src/routes/AppRouter.jsx");
    const userMenu = read("src/components/layout/UserMenu/UserMenu.jsx");

    assert.match(router, /path=\{ROUTES\.FILES\}/);
    assert.match(router, /path=\{ROUTES\.RESOURCES_SHORT\}/);
    assert.match(router, /CanonicalRedirect to=\{ROUTES\.RESOURCES\}/);
    assert.match(router, /CommunityRedirect/);
    assert.match(router, /channel\/general/);
    assert.match(router, /const \{ search \} = useLocation\(\)/);
    assert.doesNotMatch(userMenu, /pages\/profile\.html|LEGACY_ROUTES/);
    assert.match(userMenu, /to=\{ROUTES\.SETTINGS\}/);
});

test("mobile-critical application pages define compact layouts", () => {
    for (const stylesheet of [
        "src/components/layout/AppLayout/AppLayout.module.css",
        "src/pages/community/CommunityPage.module.css",
        "src/features/resourceLibrary/ResourceLibraryPage.module.css",
        "src/features/studyPlanner/StudyPlanner.module.css",
        "src/features/flashcards/FlashcardsPage.module.css",
        "src/features/quizzes/QuizPage.module.css",
        "src/features/friends/FriendsPage.module.css"
    ]) {
        const css = read(stylesheet);
        assert.match(css, /@media \(max-width:/, `${stylesheet} is responsive`);
        assert.match(
            css,
            /minmax\(0, 1fr\)|width:\s*(?:min\([^;]+,\s*100%\)|100%)|flex-wrap:\s*wrap/,
            `${stylesheet} constrains or wraps content`
        );
    }
});
