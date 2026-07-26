import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function read(path) {
    return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("production routes are profiled and expensive features stay lazy", async () => {
    const router = await read("src/routes/AppRouter.jsx");
    const community = await read("src/pages/community/CommunityPage.jsx");
    const chat = await read("src/pages/chat/ChatPage.jsx");
    const notifications = await read("src/context/NotificationContext.jsx");

    for (const profile of [
        "DashboardPage",
        "CommunitiesPage",
        "CommunityPage",
        "ChatPage"
    ]) {
        assert.match(router + community, new RegExp(`id="${profile}"`));
    }
    assert.match(
        community,
        /lazy\(\(\) => import\("\.\.\/chat\/ChatPage\.jsx"\)\)/
    );
    assert.match(chat, /const ChatFilesView = lazy/);
    assert.match(chat, /const ChatActivityView = lazy/);
    assert.doesNotMatch(
        notifications,
        /from "\.\.\/services\/notification-service\.js"/
    );
    assert.match(
        notifications,
        /import\(\s*"\.\.\/services\/notification-service\.js"/
    );
});

test("Firestore listeners are bounded and notification resubscriptions are stable", async () => {
    const channels = await read("src/services/channel-service.js");
    const notifications = await read("src/services/notification-service.js");
    const provider = await read("src/context/NotificationContext.jsx");

    assert.match(channels, /const CHANNEL_LIMIT = 100/);
    assert.match(
        channels,
        /orderBy\("position", "asc"\),\s*limit\(CHANNEL_LIMIT\)/
    );
    assert.match(notifications, /limit\(50\)/);
    assert.match(notifications, /where\("read", "==", false\),\s*limit\(500\)/);
    assert.match(provider, /notificationsEnabledRef/);
    assert.doesNotMatch(
        provider,
        /\[settings\.notifications\.enabled, showToast, userId\]/
    );
});

test("the React shell supports skip navigation and accessibility preferences", async () => {
    const layout = await read("src/components/layout/AppLayout/AppLayout.jsx");
    const settings = await read("src/context/SettingsContext.jsx");
    const accessibility = await read("css/accessibility.css");

    assert.match(layout, /href="#main-content"/);
    assert.match(layout, /id="main-content"/);
    assert.match(settings, /dataset\.reducedMotion/);
    assert.match(settings, /dataset\.contrast/);
    assert.match(settings, /dataset\.fontSize/);
    assert.match(accessibility, /@media \(forced-colors: active\)/);
});

test("observability and actionable application errors have central boundaries", async () => {
    const app = await read("src/App.jsx");
    const main = await read("src/main.jsx");
    const mapper = await read("src/utils/app-error-mapper.js");
    const observability = await read("src/services/observability-service.js");

    assert.match(app, /<AppErrorBoundary>/);
    assert.match(main, /initializePerformanceMonitoring/);
    assert.match(mapper, /getActionableErrorMessage/);
    assert.match(observability, /configureObservability/);
    assert.match(observability, /captureError/);
    assert.match(observability, /trackEvent/);
    assert.match(observability, /recordRender/);
});
