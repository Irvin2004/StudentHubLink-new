import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

const ROOT = process.cwd();

async function read(path) {
    return readFile(join(ROOT, path), "utf8");
}

test("the React application mounts one global network monitor", async () => {
    const app = await read("src/App.jsx");

    assert.equal((app.match(/<NetworkProvider>/g) || []).length, 1);
    assert.equal((app.match(/<NetworkStatus \/>/g) || []).length, 1);
    assert.match(app, /<NetworkProvider>[\s\S]*<ToastProvider>/);
});

test("browser connectivity access stays inside NetworkContext", async () => {
    const [context, hook, status] = await Promise.all([
        read("src/context/NetworkContext.jsx"),
        read("src/hooks/useNetwork.js"),
        read("src/components/NetworkStatus/NetworkStatus.jsx")
    ]);

    assert.match(context, /navigator\.onLine/);
    assert.match(context, /addEventListener\("online"/);
    assert.match(context, /addEventListener\("offline"/);
    assert.doesNotMatch(hook, /navigator|addEventListener/);
    assert.doesNotMatch(status, /navigator|addEventListener/);
});

test("network-dependent mutations consume the shared hook", async () => {
    const sources = await Promise.all(
        [
            "src/components/files/FileUploader/FileUploader.jsx",
            "src/components/chat/MessageComposer/MessageComposer.jsx",
            "src/pages/communities/CommunitiesPage.jsx"
        ].map(read)
    );

    sources.forEach((source) => assert.match(source, /useNetwork/));
});
