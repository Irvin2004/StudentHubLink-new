import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function read(path) {
    return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("the React application mounts one global toast system", async () => {
    const app = await read("src/App.jsx");
    const context = await read("src/context/ToastContext.jsx");
    const container = await read("src/components/Toast/ToastContainer.jsx");
    const toast = await read("src/components/Toast/Toast.jsx");

    assert.equal((app.match(/<ToastProvider>/g) || []).length, 1);
    assert.equal((app.match(/<ToastContainer \/>/g) || []).length, 1);
    assert.match(context, /const DEFAULT_DURATION = 4000/);
    assert.match(context, /\[toast, \.\.\.current\]/);
    assert.match(context, /dismissing: true/);
    assert.match(container, /toasts\.map/);
    assert.match(toast, /role=\{urgent \? "alert" : "status"\}/);
});

test("React presentation code does not use blocking browser alerts", async () => {
    const files = [
        "src/App.jsx",
        "src/pages/auth/LoginPage.jsx",
        "src/pages/chat/ChatPage.jsx",
        "src/pages/communities/CommunitiesPage.jsx",
        "src/pages/community/CommunityPage.jsx"
    ];

    for (const file of files) {
        assert.doesNotMatch(await read(file), /\b(?:window\.)?alert\s*\(/);
    }
});
